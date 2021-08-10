package jobs

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/facebookgo/symwalk"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/mx"
	"github.com/terotoi/koticloud/server/proc"
	"github.com/volatiletech/sqlboiler/v4/boil"
)

func ScanAllHomes(ctx context.Context, cfg *core.Config,
	np *proc.NodeProcessor, db *sql.DB) error {
	users, err := models.Users().All(ctx, db)
	if err != nil {
		return err
	}

	for _, user := range users {
		if err := ScanHome(ctx, user, cfg, np, db); err != nil {
			return err
		}
	}

	return nil
}

func ScanHome(ctx context.Context, user *models.User, cfg *core.Config,
	np *proc.NodeProcessor, db *sql.DB) error {

	root, err := mx.UserEnsureRootNode(ctx, user, cfg.HomeRoot, db)
	if err != nil {
		return err
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	ok := false
	defer func() {
		if !ok {
			tx.Rollback()
		}
	}()

	defer tx.Rollback()

	path, err := fs.PhysPath(ctx, root, cfg.HomeRoot, tx)
	if err != nil {
		return err
	}

	var done []*models.Node
	if done, err = scanDir(ctx, path, user, root, cfg, tx); err != nil {
		return err
	}

	if err = tx.Commit(); err != nil {
		return err
	}
	ok = true

	for _, node := range done {
		path, err := fs.PhysPath(ctx, node, cfg.HomeRoot, db)
		if err != nil {
			return err
		}

		if err := proc.AddNodeProcessRequest(ctx, np.Channel, node, path, false, db); err != nil {
			return err
		}
	}

	return nil
}

func scanDir(ctx context.Context, root string, user *models.User,
	rootNode *models.Node, cfg *core.Config, tx boil.ContextExecutor) ([]*models.Node, error) {
	var done []*models.Node

	f := func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		rpath := strings.TrimPrefix(path, root)

		node, err := fs.NodeByPath(ctx, rpath, rootNode, tx)
		if err != nil {
			return err
		}

		if node == nil {
			name := filepath.Base(rpath)
			parentPath := filepath.Dir(rpath)
			parent, err := fs.NodeByPath(ctx, parentPath, rootNode, tx)
			if err != nil {
				return err
			}

			if parent == nil {
				return fmt.Errorf("no parent found: %s", parentPath)
			}

			if info.IsDir() {
				node, err := fs.MakeDir(ctx, parent, name, user, cfg.HomeRoot, true, tx)
				if err != nil {
					return err
				}

				path, err := fs.PathFor(ctx, node, tx)
				if err != nil {
					return err
				}
				log.Printf("  [mkdir] %s", path)
			} else {
				mimeType, err := fs.DetectMimeType(path)
				if err != nil {
					return err
				}

				if node, err := fs.NewFile(ctx, parent, name, mimeType,
					info.Size(), user, nil, false, tx); err != nil {
				} else {
					path, err := fs.PathFor(ctx, node, tx)
					if err != nil {
						return err
					}
					log.Printf("  [new] %s", path)

					done = append(done, node)
				}
			}
		} else {
			if fs.IsDir(node) != info.IsDir() {
				return fmt.Errorf("File entry type mismatch: %s", rpath)
			}
		}
		return nil
	}

	var err error
	if cfg.ScanFollowSymlinks {
		err = symwalk.Walk(root, f)
	} else {
		err = filepath.Walk(root, f)
	}

	return done, err
}
