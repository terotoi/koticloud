package api

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/proc"
)

// ScanDeletedNodes scans for deleted files or dangling links in the file store.
func ScanDeletedNodes(fileRoot, thumbRoot string, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		log.Printf("Scanning for physically deleted nodes issued by %s.", user.Name)

		nodes, err := fs.NodesAll(ctx, db)
		if reportInt(err, r, w) != nil {
			return
		}

		var deleted []*models.Node
		var dirs []*models.Node

		for _, node := range nodes {
			if fs.IsDir(node) {
				continue
			}

			_, err := os.Stat(fs.NodeLocalPath(fileRoot, node.ID, true))
			if os.IsNotExist(err) {
				log.Printf("Node %d does not exist in filesystem, deleting from database.", node.ID)

				if _, err = fs.Delete(ctx, node, false, false, user, fileRoot, thumbRoot, db); err != nil {
					log.Println(err)
				} else {
					log.Printf("Deleted a file node: %d %s", node.ID, node.Name)
					deleted = append(deleted, node)

					if node.ParentID.Valid {
						found := false
						for _, dir := range dirs {
							if node.ParentID.Int == dir.ID {
								found = true
								break
							}
						}

						if !found {
							dir, err := fs.NodeByID(ctx, node.ParentID.Int, db)
							if err != nil {
								log.Println(err)
							} else if dir != nil {
								dirs = append(dirs, dir)
							}
						}
					}
				}
			}

			// Delete resulting empty directories
			for _, dir := range dirs {
				_, err := fs.Delete(ctx, dir, false, false, user, fileRoot, thumbRoot, db)
				if err != nil {
					log.Println(err)
				} else {
					log.Printf("Deleted an empty directory node: %d %s", node.ID, node.Name)
				}
			}
		}

		log.Printf("Scanning of physically deleted files finished (issued by %s)", user.Name)
		respJSON(append(deleted, dirs...), r, w)
	}
}

// GenerateAllThumbnails regenerates all thumbnails.
func GenerateAllThumbnails(np *proc.NodeProcessor, fileRoot string, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		log.Println("Regenerating all thumbnails.")
		if err := np.GenerateAllThumbs(r.Context(), fileRoot, db); err != nil {
			log.Println(err)
		}

		log.Println("Done regenerating all thumbnails.")
	}
}
