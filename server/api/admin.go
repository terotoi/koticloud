package api

import (
	"context"
	"database/sql"
	"log"
	"net/http"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/jobs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/proc"
)

// GenerateAllThumbnails regenerates all thumbnails.
func GenerateAllThumbnails(np *proc.NodeProcessor, homeRoot string, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		log.Println("Regenerating all thumbnails.")
		if err := np.GenerateAllThumbs(r.Context(), homeRoot, db); err != nil {
			log.Println(err)
		}

		log.Println("Done regenerating all thumbnails.")
	}
}

// Scan for deleted nodes and new files and directories from all home directories.
func ScanAll(np *proc.NodeProcessor, cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {

		job := func() {
			ctx := context.Background()
			log.Printf("[scan] Scanning for physically deleted nodes issued by %s", user.Name)

			err := jobs.ScanDeletedNodes(ctx, user, cfg, db)
			if err != nil {
				log.Printf("[scan] Error: %s", err.Error())
				return
			}

			log.Printf("[scan] Scanning of physically deleted files finished (issued by %s)", user.Name)

			log.Printf("[scan] Scanning for new files and directories issued by %s", user.Name)
			err = jobs.ScanAllHomes(ctx, cfg, np, db)
			if err != nil {
				log.Printf("[scan] Error: %s", err.Error())
				return
			}
			log.Printf("[scan] Scanning for new files and directories issued by %s finished.", user.Name)
		}

		go job()
	}
}
