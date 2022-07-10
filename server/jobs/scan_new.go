package jobs

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"log"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"github.com/terotoi/koticloud/server/core"
	vfs "github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/mx"
)

// Number of concurrent scans
const maxRunningScans = 8

type PathEntry struct {
	Path     string
	DirEntry fs.DirEntry
	Root     *models.Node
	RootPath string
	User     *models.User
}

func ScanAllHomes(ctx context.Context, cfg *core.Config, np *NodeProcessor, db *sql.DB) error {
	users, err := models.Users().All(ctx, db)
	if err != nil {
		return err
	}

	// Collect all paths
	var paths []*PathEntry
	for _, user := range users {
		p, err := listHomePaths(ctx, user, cfg, db)

		if err != nil {
			log.Printf("[scan] %s", err)
		} else {
			paths = append(paths, p...)
		}
	}

	// Take the directories
	var dirs []*PathEntry
	var files []*PathEntry
	for _, p := range paths {
		if p.DirEntry.IsDir() {
			dirs = append(dirs, p)
		} else {
			files = append(files, p)
		}
	}

	// Sort directories by path
	sort.Slice(paths, func(i, j int) bool {
		return paths[i].Path < paths[j].Path
	})

	// Make the directories first
	for _, p := range dirs {
		if err := scanPath(ctx, p, np, cfg, db); err != nil {
			log.Printf("[scan] %s", err)
		}
	}

	// Distrubute file paths to workers
	g := make(chan struct{}, maxRunningScans)
	var wg sync.WaitGroup

	for _, p := range files {
		g <- struct{}{} // Block until we can acquire a slot
		wg.Add(1)

		f := func(p *PathEntry) {
			if err := scanPath(ctx, p, np, cfg, db); err != nil {
				log.Printf("[scan] %s", err)
			}

			wg.Done()
			<-g // Release a slot
		}
		go f(p)
	}

	// Wait for all workers to finish
	wg.Wait()

	return nil
}

// List all paths under user's home directory
func listHomePaths(ctx context.Context, user *models.User, cfg *core.Config, db *sql.DB) ([]*PathEntry, error) {
	root, err := mx.UserEnsureRootNode(ctx, user, cfg.HomeRoot, db)
	if err != nil {
		return nil, err
	}

	rootPath, err := vfs.PhysPath(ctx, root, cfg.HomeRoot, db)
	if err != nil {
		return nil, err
	}

	paths, err := listPaths(rootPath, root)
	if err != nil {
		return nil, err
	}

	for _, p := range paths {
		p.User = user
	}

	return paths, nil
}

// Collect all paths under a given path
func listPaths(rootPath string, root *models.Node) ([]*PathEntry, error) {
	var p []*PathEntry

	f := func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		p = append(p, &PathEntry{Path: path, DirEntry: d, Root: root, RootPath: rootPath})
		return nil
	}

	err := filepath.WalkDir(rootPath, f)
	return p, err
}

// Scans a single path for a new file or directory
func scanPath(ctx context.Context, p *PathEntry, np *NodeProcessor, cfg *core.Config, db *sql.DB) error {
	rpath := strings.TrimPrefix(p.Path, p.RootPath)

	//log.Printf("[scan] scanning path %s", rpath)

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	node, err := vfs.NodeByPath(ctx, rpath, p.Root, tx)
	if err != nil {
		return err
	}

	if node == nil {
		name := filepath.Base(rpath)
		parentPath := filepath.Dir(rpath)
		parent, err := vfs.NodeByPath(ctx, parentPath, p.Root, tx)
		if err != nil {
			return err
		}

		if parent == nil {
			return fmt.Errorf("no parent found: %s", parentPath)
		}

		if p.DirEntry.IsDir() {
			node, err := vfs.MakeDir(ctx, parent, name, p.User, cfg.HomeRoot, true, tx)
			if err != nil {
				return err
			}

			path, err := vfs.PathFor(ctx, node, tx)
			if err != nil {
				return err
			}

			log.Printf("[scan] mkdir %s", path)

			if err := tx.Commit(); err != nil {
				return err
			}
		} else {
			mimeType, err := vfs.DetectMimeType(p.Path)
			if err != nil {
				log.Println(err)
				return nil
			}

			entry, err := p.DirEntry.Info()
			if err != nil {
				log.Println(err)
				return nil
			}

			if node, err := vfs.NewFile(ctx, parent, name, mimeType,
				entry.Size(), p.User, nil, false, tx); err != nil {
				return err
			} else {
				path, err := vfs.PathFor(ctx, node, tx)
				if err != nil {
					return err
				}

				log.Printf("[scan] new file %s", path)

				if err := tx.Commit(); err != nil {
					return err
				}

				// Add to processor
				physPath, err := vfs.PhysPath(ctx, node, cfg.HomeRoot, db)
				if err != nil {
					return err
				}

				log.Printf("[scan] add to processor %s", physPath)

				if err := AddNodeProcessRequest(ctx, np.Channel, node, physPath, false, db); err != nil {
					return err
				}
			}
		}
	} else {
		if vfs.IsDir(node) != p.DirEntry.IsDir() {
			log.Printf("file entry type mismatch: %s", rpath)
		}
	}
	return nil
}
