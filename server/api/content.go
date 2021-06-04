package api

import (
	"database/sql"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"

	"github.com/go-chi/chi"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/queries"
)

// FileNotFoundHandler is called by NodeGet if a file for the
// requested node was not found.
// This gives the code possibility to serve generic thumbnails.
type FileNotFoundHandler func(w http.ResponseWriter, r *http.Request, node *models.Node, db *sql.DB)

// NodeGet returns contents of a node from the given root.
//
// If mimeTypeFromDB is true, Content-Type header is set from
// node.MimeType, otherwise it is set by ServeContent from the file itself.
//
// If preCheck is not nil, it is called with the node. If it returns false
// the content is considered not existing.
//
// If fileNotFound is not nil and the context is not found, this
// function is called.
//
func NodeGet(fileRoot string, mimeTypeFromDB bool, preCheck func(*models.Node) bool,
	fileNotFound FileNotFoundHandler, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "nodeID"))
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		node, err := fs.NodeByID(r.Context(), id, db)
		if reportIf(err, http.StatusNotFound, "", r, w) != nil {
			return
		}

		if !fs.AccessAllowed(user, node, false) {
			reportUnauthorized("no access", r, w)
			return
		}

		if preCheck != nil && !preCheck(node) {
			fileNotFound(w, r, node, db)
		} else {
			fh, err := os.Open(fs.NodeLocalPath(fileRoot, node.ID, true))
			if err != nil && os.IsNotExist(err) && fileNotFound != nil {
				fileNotFound(w, r, node, db)
			} else {
				if reportInt(err, r, w) != nil {
					return
				}

				if mimeTypeFromDB {
					w.Header().Add("Content-Type", node.MimeType)
				}
				//w.Header().Add("Cache-Control", "private, max-age=0, no-cache")
				http.ServeContent(w, r, node.Name, node.ModifiedOn, fh)
			}
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
func ContentServeThumbFallback(thumbRoot, staticRoot string) FileNotFoundHandler {
	return func(w http.ResponseWriter, r *http.Request, node *models.Node, db *sql.DB) {
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
				http.ServeFile(w, r, fs.NodeLocalPath(thumbRoot, p.ID, true))
				return
			}
		}

		err := serveGenericThumb(w, r, node, staticRoot)
		if reportInt(err, r, w) != nil {
			return
		}
	}
}
