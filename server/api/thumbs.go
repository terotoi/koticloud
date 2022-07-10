package api

import (
	"database/sql"
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/go-chi/chi"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/queries"
)

// ThumbGet returns contents of a thumbnail for a node.
// If a custom thumbnail is not found, a generic icon is served.
func ThumbGet(cfg *core.Config, db *sql.DB) func(user *models.User, tokenNode *models.Node, w http.ResponseWriter, r *http.Request) {
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

		serveThumb(w, r, node, cfg, db)
	}
}

func serveThumb(w http.ResponseWriter, r *http.Request, node *models.Node, cfg *core.Config, db *sql.DB) {
	path := fs.ThumbPath(cfg.ThumbRoot, node.ID, true)

	stat, err := os.Stat(path)
	if err != nil && os.IsNotExist(err) {
		logRequest(r, fmt.Sprintf("thumb not found, serving fallback: %s", path))
		ContentServeThumbFallback(w, r, node, cfg, db)
	} else {
		if reportInt(err, r, w) != nil {
			return
		}

		fh, err := os.Open(path)
		if reportInt(err, r, w) != nil {
			return
		}

		w.Header().Add("Content-Type", "image/jpeg")
		http.ServeContent(w, r, node.Name, stat.ModTime(), fh)
	}
}

func serveGenericThumb(w http.ResponseWriter, r *http.Request, node *models.Node,
	staticRoot string) error {
	filename := strings.Replace(strings.Replace(node.MimeType, "-", "_", -1),
		"/", "-", -1) + ".svg"

	path := staticRoot + "/icons/types/" + filename
	stat, err := os.Stat(path)
	if os.IsNotExist(err) {
		path = staticRoot + "/icons/types/application-octet_stream.svg"
		stat, err = os.Stat(path)
	}

	if reportInt(err, r, w) != nil {
		return err
	}

	fh, err := os.Open(path)
	if reportInt(err, r, w) != nil {
		return err
	}

	http.ServeContent(w, r, node.Name+".svg", stat.ModTime(), fh)
	return nil
}

// ContentServeThumbFallback servers generic thumbnail images from
// /static/images/mimetype.svg
func ContentServeThumbFallback(w http.ResponseWriter, r *http.Request,
	node *models.Node, cfg *core.Config, db *sql.DB) {
	if node.Type == "directory" {
		var nodes []models.Node

		query :=
			"WITH RECURSIVE subs AS (" +
				"SELECT nodes.* " +
				"FROM nodes " +
				"WHERE id = $1 " +
				"UNION " +
				"SELECT n.* FROM nodes n " +
				"INNER JOIN subs c ON c.id = n.parent_id) " +
				"SELECT *	FROM subs WHERE has_custom_thumb = true"
		err := queries.Raw(query, node.ID).Bind(r.Context(), db, &nodes)
		if reportIf(err, http.StatusInternalServerError, "", r, w) != nil {
			return
		}

		if len(nodes) > 0 {
			n := nodes[rand.Intn(len(nodes))]
			serveThumb(w, r, &n, cfg, db)
			//http.ServeFile(w, r, fs.ThumbPath(thumbRoot, p.ID, true))
			return
		} else {
			logRequest(r, fmt.Sprintf("no custom thumbs found for directory %s", node.Name))
		}
	}

	err := serveGenericThumb(w, r, node, cfg.StaticRoot)
	if reportInt(err, r, w) != nil {
		return
	}
}
