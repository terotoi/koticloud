package main

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
)

// App contains the high-level functions with which to use the API.
type App struct {
	BaseURL     string
	Username    string
	AuthToken   string
	RemoteDir   string
	RemoteDirID int // Cached id of the current dir
}

func printNodeHeader() {
	fmt.Printf("ID Name                                       Type       Mime Type       Size    Modified\n")
	fmt.Printf("===============================================================================================\n")
}

func printNode(node *models.Node, nl bool) {
	fmt.Printf("%-5d  %-40.40s  %-10.10s  %-16.16s %12d  %30.30s  ",
		node.ID, node.Name, node.Type, node.MimeType, node.Size.Int64,
		node.ModifiedOn.Format(time.UnixDate))

	if nl {
		fmt.Println()
	}
}

func printNodeWithProgress(node *fs.NodeWithProgress) {
	printNode(&node.Node, false)

	if node.Progress.Valid || node.Volume.Valid {
		var progress float32
		var volume float32

		if node.Progress.Valid {
			progress = node.Progress.Float32
		}

		if node.Volume.Valid {
			volume = node.Volume.Float32
		}

		fmt.Printf("  progress: %.1f volume: %.1f\n", progress, volume)
	}
	fmt.Println()
}

// Resolve path using current remove dir.
func (app *App) resolvePath(p string) string {
	full := app.RemoteDir

	if p == "." {
		return full
	} else if p == ".." {
		return filepath.Dir(p)
	}

	if strings.HasPrefix(p, "/") {
		full = p
	} else {
		if !strings.HasSuffix(full, "/") {
			full += "/"
		}

		full += p
	}
	if full == "" {
		full = "/"
	}
	return full
}
