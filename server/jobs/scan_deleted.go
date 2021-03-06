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

	var dirs []*models.Node

	for _, node := range nodes {
		if fs.IsDir(node) {
			continue
		}

		path, err := fs.PhysPath(ctx, node, cfg.HomeRoot, db)
		if err != nil {
			log.Printf("[scan-deleted] %s", err)
			continue
		}

		if _, err = os.Stat(path); os.IsNotExist(err) {
			log.Printf("[scan-deleted] node %d does not exist in filesystem, deleting from database.", node.ID)

			if _, err = fs.Delete(ctx, node, false, user, cfg.HomeRoot, cfg.ThumbRoot, db); err != nil {
				log.Printf("[scan-deleted] %s", err)
			} else {
				log.Printf("[scan-deleted] deleted a file node: %d %s", node.ID, node.Name)

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
							log.Printf("[scan-deleted] %s", err)
						} else if dir != nil && !dir.ParentID.Valid {
							// Do not delete any root directories
							dirs = append(dirs, dir)
						}
					}
				}
			}
		} else if err != nil {
			log.Printf("[scan-deleted] %s", err)
		}

		// Delete resulting empty directories
		for _, dir := range dirs {
			_, err := fs.Delete(ctx, dir, false, user, cfg.HomeRoot, cfg.ThumbRoot, db)
			if err != nil {
				log.Printf("[scan-deleted] %s", err)
			} else {
				log.Printf("[scan-deleted] deleted an empty directory node: %d %s", node.ID, node.Name)
			}
		}
	}

	return nil
}
