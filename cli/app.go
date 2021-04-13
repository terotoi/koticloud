package main

import (
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/terotoi/koticloud/server/api"
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

func printNode(node *models.Node) {
	fmt.Printf("%-4d %-40s %-10s %-16s %12d  %s\n",
		node.ID, node.Name, node.Type, node.MimeType, node.Size.Int64,
		node.ModifiedOn.Format(time.UnixDate))
}

func printNodeWithMeta(node *api.NodeWithMeta) {
	fmt.Printf("%-4d %-40s %-10s %-16s %12d  %s\n",
		node.ID, node.Name, node.Type, node.MimeType, node.Size.Int64,
		node.ModifiedOn.Format(time.UnixDate))

	if node.MetaData.Valid {
		fmt.Printf("   meta: %s\n", node.MetaData.JSON)
	}
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
