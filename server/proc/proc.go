package proc

import (
	"context"
	"database/sql"
	"log"
	"os"
	"strings"
	"sync"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries"
)

const maxReqs = 50000

// NodeProcessRequest is used to signal the processor about new requests.
type NodeProcessRequest struct {
	Quit bool // Stop the thumbnailer
}

// NodeProcessor processes thumbnails, video durations, etc on new nodes.
type NodeProcessor struct {
	Channel   chan NodeProcessRequest
	WaitGroup sync.WaitGroup

	ctx         context.Context
	thumbRoot   string
	thumbMethod string
	tempDir     string
	db          *sql.DB
}

// RunNodeProc starts the node processor.
func RunNodeProc(thumbRoot, tempDir, thumbMethod string, db *sql.DB) *NodeProcessor {
	np := NodeProcessor{
		ctx:         context.Background(),
		Channel:     make(chan NodeProcessRequest, maxReqs),
		thumbRoot:   thumbRoot,
		thumbMethod: thumbMethod,
		tempDir:     tempDir,
		db:          db,
	}

	np.WaitGroup.Add(1)

	go func() {
		log.Println("Node processor started.")
		np.processAllPending()

		for {
			r := <-np.Channel

			if r.Quit {
				log.Println("Stopping processor")
				break
			}
			np.processAllPending()
		}

		np.WaitGroup.Done()
	}()

	return &np
}

// End sends a quit request to the node processor.
func (np *NodeProcessor) End() {
	np.Channel <- NodeProcessRequest{Quit: true}
}

func (np *NodeProcessor) processAllPending() {
	for {
		np.ctx = context.Background()

		tx, err := np.db.BeginTx(np.ctx, nil)
		if err != nil {
			log.Printf("nodeproc: %s. stopping", err)
		}

		req, err := models.NodeProcessReqs().One(np.ctx, tx)
		if err != nil {
			tx.Rollback()
			break
		}

		err = np.processRequest(req, tx)
		if err != nil {
			log.Println(err.Error())
			tx.Rollback()
			break
		}

		if _, err = req.Delete(np.ctx, tx); err != nil {
			log.Printf("nodeproc: %s", err)
			tx.Rollback()
			break
		}

		if err := tx.Commit(); err != nil {
			log.Printf("nodeporc: %s", err)
		}
	}
}

func (np *NodeProcessor) processRequest(req *models.NodeProcessReq, tx boil.ContextExecutor) error {
	if req.RemoveUpload {
		defer func() {
			os.Remove(req.Path)
		}()
	}

	node, err := fs.NodeByID(np.ctx, req.NodeID, tx)
	if err != nil {
		return err
	}

	log.Printf("nodeproc: processing %d %s", node.ID, node.Name)

	var updated bool
	if err := generateThumbnail(node, req.RemoveUpload, req.Path, np.thumbRoot, np.tempDir, np.thumbMethod); err != nil {
		log.Printf("Error generating thumbnail for node: %d path: %s: error: %s",
			node.ID, req.Path, err.Error())
	} else {
		updated = true
	}

	if util.IsVideo(node.MimeType) || util.IsAudio(node.MimeType) {
		err := queryVideoDuration(node, req.Path)

		if err != nil {
			log.Printf("Error querying video duration for node: %d path: %s: %s",
				node.ID, req.Path, err.Error())
		} else {
			updated = true
		}
	}

	if updated {
		_, err = node.Update(np.ctx, tx, boil.Infer())
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
func (np *NodeProcessor) GenerateAllThumbs(ctx context.Context, homeRoot string, db *sql.DB) error {
	formats := util.TypesWithCustomThumbnails()
	types := "'" + strings.Join(formats, "', '") + "'"

	var nodes []*models.Node
	if err := queries.Raw("SELECT * FROM nodes WHERE mime_type IN ("+types+")").Bind(ctx, db, &nodes); err != nil {
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
