package api

import (
	"database/sql"
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

		path := fs.ThumbPath(cfg.ThumbRoot, node.ID, true)

		fh, err := os.Open(path)
		if err != nil && os.IsNotExist(err) {
			ContentServeThumbFallback(cfg.ThumbRoot, cfg.StaticRoot, w, r, node, db)
		} else {
			if reportInt(err, r, w) != nil {
				return
			}

			w.Header().Add("Content-Type", "image/jpeg")
			http.ServeContent(w, r, node.Name, node.ModifiedOn, fh)
		}
	}
}

func serveGenericThumb(w http.ResponseWriter, r *http.Request, node *models.Node,
	staticRoot string) error {
	filename := strings.Replace(strings.Replace(node.MimeType, "-", "_", -1),
		"/", "-", -1) + ".svg"

	fh, err := os.Open(staticRoot + "/icons/types/" + filename)
	if os.IsNotExist(err) {
		fh, err = os.Open(staticRoot + "/icons/types/application-octet_stream.svg")
	}

	if err != nil {
		return err
	}

	http.ServeContent(w, r, node.Name+".svg", node.ModifiedOn, fh)
	return nil
}

// ContentServeThumbFallback servers generic thumbnail images from
// /static/images/mimetype.svg
func ContentServeThumbFallback(thumbRoot, staticRoot string,
	w http.ResponseWriter, r *http.Request, node *models.Node, db *sql.DB) {
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
			p := nodes[rand.Intn(len(nodes))]
			http.ServeFile(w, r, fs.ThumbPath(thumbRoot, p.ID, true))
			return
		}
	}

	err := serveGenericThumb(w, r, node, staticRoot)
	if reportInt(err, r, w) != nil {
		return
	}
}
