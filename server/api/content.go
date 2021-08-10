package api

import (
	"database/sql"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
)

// NodeGet returns contents of a node from the given root.
//
func NodeGet(homeRoot string, db *sql.DB) func(user *models.User, tokenNode *models.Node, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, tokenNode *models.Node, w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "nodeID"))
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		node, err := fs.NodeByID(r.Context(), id, db)
		if reportIf(err, http.StatusNotFound, "", r, w) != nil {
			return
		}

		// Node-specific tokens are only allowed to access that node.
		if tokenNode != nil && tokenNode.ID != node.ID {
			reportUnauthorized("no access", r, w)
			return
		}

		if !fs.AccessAllowed(user, node, false) {
			reportUnauthorized("no access", r, w)
			return
		}

		path, err := fs.PhysPath(r.Context(), node, homeRoot, db)
		if reportInt(err, r, w); err != nil {
			return
		}

		fh, err := os.Open(path)
		if reportInt(err, r, w) != nil {
			return
		}

		log.Printf("NodeGet %s (%d) served %s (%d)", user.Name, user.ID,
			node.Name, node.ID)

		w.Header().Add("Content-Type", node.MimeType)
		//w.Header().Add("Cache-Control", "private, max-age=0, no-cache")
		http.ServeContent(w, r, node.Name, node.ModifiedOn, fh)
	}
}
