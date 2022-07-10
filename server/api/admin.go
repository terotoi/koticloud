package api

import (
	"context"
	"database/sql"
	"log"
	"net/http"
	"sync"

	"github.com/go-chi/chi"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/jobs"
	"github.com/terotoi/koticloud/server/models"
)

var scanLock sync.Mutex
var scanDeletedRunning bool
var scanNewRunning bool

// GenerateAllThumbnails regenerates all thumbnails.
func GenerateAllThumbnails(np *jobs.NodeProcessor, homeRoot string, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		onlyMissing := chi.URLParam(r, "onlyMissing") == "true"

		if onlyMissing {
			log.Printf("[thumbnails] Generating missing thumbnails issued by %s", user.Name)
		} else {
			log.Printf("[thumbnails] Generating all thumbnails issued by %s", user.Name)
		}
		if err := np.GenerateAllThumbs(r.Context(), onlyMissing, homeRoot, db); err != nil {
			log.Println(err)
		}

		log.Printf("[thumbnails] Generating all thumbnails finished (issued by %s)", user.Name)
	}
}

// Scan for deleted nodes.
func ScanDeleted(np *jobs.NodeProcessor, cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {

		job := func() {
			ctx := context.Background()
			log.Printf("[scan-deleted] Scanning for deleted nodes issued by %s", user.Name)

			err := jobs.ScanDeletedNodes(ctx, user, cfg, db)
			if err != nil {
				log.Printf("[scan-deleted] error: %s", err.Error())
				return
			}

			log.Printf("[scan-deleted] Scanning of deleted files finished (issued by %s)", user.Name)
		}

		go job()
	}
}

// Scan for deleted nodes and new files and directories from all home directories.
func ScanAll(np *jobs.NodeProcessor, cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		scanLock.Lock()
		defer scanLock.Unlock()

		if !scanDeletedRunning && !scanNewRunning {
			scanDeletedRunning = true
			scanNewRunning = true

			jobScanDeleted := func() {
				ctx := context.Background()
				log.Printf("[scan] Scanning for deleted nodes issued by %s", user.Name)

				err := jobs.ScanDeletedNodes(ctx, user, cfg, db)
				if err != nil {
					log.Printf("[scan] Error: %s", err.Error())
					return
				}

				log.Printf("[scan] Finished scanning of deleted files (issued by %s)", user.Name)
				scanLock.Lock()
				scanDeletedRunning = false
				scanLock.Unlock()
			}
			go jobScanDeleted()

			jobScanNew := func() {
				ctx := context.Background()

				log.Printf("[scan] Scanning for new files and directories issued by %s", user.Name)
				err := jobs.ScanAllHomes(ctx, cfg, np, db)
				if err != nil {
					log.Printf("[scan] Error: %s", err.Error())
					return
				}
				log.Printf("[scan] Finished scanning for new files and directories issued by %s.", user.Name)

				scanLock.Lock()
				scanNewRunning = false
				scanLock.Unlock()
			}

			go jobScanNew()

			respJSON(true, r, w)
		}
		respJSON(false, r, w)
	}
}
