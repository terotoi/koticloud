package api

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// MetaUpdateRequest contains information about metadata update.
type MetaUpdateRequest struct {
	NodeID int
	UserID int // optional
	Type   string
	Data   interface{}
}

// MetaUpdate handles updates to user-specific metadata.
func MetaUpdate(db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req MetaUpdateRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		if req.Type != "progress" {
			report("bad metadata type", http.StatusBadRequest, r, w)
			return
		}

		tx, err := db.BeginTx(r.Context(), nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		ctx := r.Context()

		node, err := fs.NodeByID(ctx, req.NodeID, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		if !fs.AccessAllowed(user, node, true) {
			reportUnauthorized("no access", r, w)
			return
		}

		meta, err := models.Meta(qm.Where("node_id=?", node.ID),
			qm.And("user_id=?", user.ID),
			qm.And("type=?", req.Type)).All(ctx, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		if len(meta) > 0 {
			m := meta[0]

			err := m.Data.Marshal(req.Data)
			if reportInt(err, r, w) != nil {
				return
			}

			_, err = m.Update(ctx, tx, boil.Infer())
			if reportInt(err, r, w) != nil {
				return
			}
		} else {
			m := models.Metum{UserID: user.ID, NodeID: node.ID, Type: req.Type}
			err := m.Data.Marshal(req.Data)
			if reportInt(err, r, w) != nil {
				return
			}

			err = m.Insert(ctx, tx, boil.Infer())
			if reportInt(err, r, w) != nil {
				return
			}
		}

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		respJSON(true, r, w)
	}
}
