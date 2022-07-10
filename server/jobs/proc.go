package jobs

import (
	"context"
	"database/sql"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries"
)

const maxReqs = 50000
const maxRunningProcs = 8

// NodeProcessRequest is used to signal the processor about new requests.
type NodeProcessRequest struct {
	Quit bool // Stop the thumbnailer
}

// NodeProcessor processes thumbnails, video durations, etc on new nodes.
type NodeProcessor struct {
	Channel   chan NodeProcessRequest
	WaitGroup sync.WaitGroup // WaitGroup to signal end of the processor

	ctx         context.Context
	thumbRoot   string
	thumbMethod string
	tempDir     string
	db          *sql.DB
}

// RunNodeProc starts the node processor.
func RunNodeProc(cfg *core.Config, db *sql.DB) *NodeProcessor {
	np := NodeProcessor{
		ctx:         context.Background(),
		Channel:     make(chan NodeProcessRequest, maxReqs),
		thumbRoot:   cfg.ThumbRoot,
		thumbMethod: cfg.ThumbMethod,
		tempDir:     cfg.ThumbRoot,
		db:          db,
	}

	np.WaitGroup.Add(1)
	var wg sync.WaitGroup
	g := make(chan struct{}, maxRunningProcs)

	var takeMutex sync.Mutex

	go func() {
		log.Println("[process] file processor started.")

		for {
			g <- struct{}{} // Block until we can acquire a slot
			wg.Add(1)

			f := func() {
				for {
					tx, err := np.db.BeginTx(np.ctx, nil)
					if err != nil {
						log.Printf("[process] error: %s", err)
						break
					}
					defer tx.Rollback()

					takeMutex.Lock()

					// Take one request, break out if failed
					req, err := models.NodeProcessReqs().One(np.ctx, tx)

					if err != nil {
						tx.Rollback()
						takeMutex.Unlock()
						break
					} else if _, err = req.Delete(np.ctx, tx); err != nil {
						log.Printf("[process] %s", err)
						tx.Rollback()
						takeMutex.Unlock()
					} else if err := tx.Commit(); err != nil {
						tx.Rollback()
						log.Printf("[process] %s", err)
						takeMutex.Unlock()
					} else {
						takeMutex.Unlock()
						err = np.processRequest(req)
						if err != nil {
							log.Printf("[process] %s", err)
						}
					}
				}
				wg.Done()
				<-g // Release a slot
			}
			go f()

			r := <-np.Channel

			if r.Quit {
				log.Println("[process] file processor stopped.")
				break
			}
		}

		np.WaitGroup.Done()
	}()

	return &np
}

// End sends a quit request to the node processor.
func (np *NodeProcessor) End() {
	np.Channel <- NodeProcessRequest{Quit: true}
}

func (np *NodeProcessor) processRequest(req *models.NodeProcessReq) error {
	if req.RemoveUpload {
		defer func() {
			os.Remove(req.Path)
		}()
	}

	tx, err := np.db.BeginTx(np.ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	node, err := fs.NodeByID(np.ctx, req.NodeID, tx)
	if err != nil {
		return err
	}

	log.Printf("[process] Processing %d %s", node.ID, node.Name)

	var updated bool
	var duration float64

	if util.IsVideo(node.MimeType) || util.IsAudio(node.MimeType) {
		duration, err = queryVideoDuration(node, req.Path)

		if err != nil {
			log.Printf("[process] Error querying video duration for node: %d path: %s: %s",
				node.ID, req.Path, err.Error())
		} else {
			node.Length = null.Float64{Float64: duration, Valid: true}
			updated = true
		}
	}

	if err := generateThumbnail(node, req.RemoveUpload, req.Path, np.thumbRoot, np.tempDir, np.thumbMethod); err != nil {
		log.Printf("Error generating thumbnail for node: %d path: %s: error: %s",
			node.ID, req.Path, err.Error())
	} else {
		updated = true
	}

	if updated {
		_, err = node.Update(np.ctx, tx, boil.Infer())

		if err := tx.Commit(); err != nil {
			log.Printf("[process] %s", err)
		}
	}

	return err
}

// AddNodeProcessRequest adds a request to process a node into the queue.
func AddNodeProcessRequest(ctx context.Context, procCh chan NodeProcessRequest, node *models.Node,
	file string, removeUpload bool, db *sql.DB) error {
	req := models.NodeProcessReq{NodeID: node.ID, Path: file, RemoveUpload: removeUpload}
	err := req.Insert(ctx, db, boil.Infer())
	if err == nil {
		procCh <- NodeProcessRequest{Quit: false}
	}
	return err
}

// (Re)generate all thumbnails.
func (np *NodeProcessor) GenerateAllThumbs(ctx context.Context, onlyMissing bool, homeRoot string, db *sql.DB) error {
	formats := util.TypesWithCustomThumbnails()
	types := "'" + strings.Join(formats, "', '") + "'"
	query := "SELECT * FROM nodes WHERE mime_type IN (" + types + ")"
	if onlyMissing {
		query += " AND NOT has_custom_thumb"
	}

	var nodes []*models.Node
	if err := queries.Raw(query).Bind(ctx, db, &nodes); err != nil {
		return err
	}

	for _, n := range nodes {
		path, err := fs.PhysPath(ctx, n, homeRoot, db)
		if err != nil {
			log.Println(err)
		} else {
			AddNodeProcessRequest(ctx, np.Channel, n, path,
				false, db)
		}
	}

	return nil
}
