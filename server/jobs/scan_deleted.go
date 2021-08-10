package jobs

import (
	"context"
	"database/sql"
	"log"
	"os"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
)

// ScanDeletedNodes scans for deleted files or dangling links in the file store.
func ScanDeletedNodes(ctx context.Context, user *models.User, cfg *core.Config, db *sql.DB) error {
	nodes, err := fs.NodesAll(ctx, db)
	if err != nil {
		return err
	}

	var deleted []*models.Node
	var dirs []*models.Node

	for _, node := range nodes {
		if fs.IsDir(node) {
			continue
		}

		path, err := fs.PhysPath(ctx, node, cfg.HomeRoot, db)
		if err != nil {
			log.Println(err.Error())
			continue
		}

		if _, err = os.Stat(path); os.IsNotExist(err) {
			log.Printf("Node %d does not exist in filesystem, deleting from database.", node.ID)

			if _, err = fs.Delete(ctx, node, false, user, cfg.HomeRoot, cfg.ThumbRoot, db); err != nil {
				log.Println(err)
			} else {
				log.Printf("Deleted a file node: %d %s", node.ID, node.Name)
				deleted = append(deleted, node)

				if node.ParentID.Valid {
					// Add unique parents
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
						} else if dir != nil && !dir.ParentID.Valid {
							// Do not delete any root directories
							dirs = append(dirs, dir)
						}
					}
				}
			}
		} else if err != nil {
			log.Println(err.Error())
		}

		// Delete resulting empty directories
		for _, dir := range dirs {
			_, err := fs.Delete(ctx, dir, false, user, cfg.HomeRoot, cfg.ThumbRoot, db)
			if err != nil {
				log.Println(err)
			} else {
				log.Printf("Deleted an empty directory node: %d %s", node.ID, node.Name)
			}
		}
	}

	return nil
}
