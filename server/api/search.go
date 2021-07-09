package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// SearchRequest is used to search for nodes.
// All Terms must be found in a filename to match it.
type SearchRequest struct {
	Text string
}

// NodeSearch searches for nodes matching specific creteria.
func NodeSearch(db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)
		var req SearchRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		log.Printf("Node search by %s: %s", user.Name, req.Text)

		qtext := "lower(name) LIKE ?"
		var query []qm.QueryMod
		for _, term := range strings.Split(strings.ToLower(req.Text), " ") {
			t := fmt.Sprintf("%%%s%%", term)
			if query == nil {
				query = append(query, qm.Where(qtext, t))
			} else {
				query = append(query, qm.And(qtext, t))
			}
		}

		var nodes []*models.Node
		if len(query) > 0 {
			query = append(query, qm.And("owner_id=?", user.ID))
			query = append(query, qm.OrderBy("name"))

			nodes, err = models.Nodes(query...).All(r.Context(), db)
			if reportInt(err, r, w) != nil {
				return
			}
		}

		var filtered []*models.Node
		for _, n := range nodes {
			if fs.AccessAllowed(user, n, false) {
				filtered = append(filtered, n)
			}
		}

		respJSON(filtered, r, w)
	}
}
