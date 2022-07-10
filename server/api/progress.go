package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// ProgressUpdateRequest contains information about progress update.
type ProgressUpdateRequest struct {
	NodeID   int
	UserID   int // optional
	Volume   float32
	Progress float32
}

// UpdateProgress updates viewing progress (and current volume, if applicable.)
func UpdateProgress(db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req ProgressUpdateRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
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

		prgs, err := models.Progresses(qm.Where("node_id=?", node.ID),
			qm.And("user_id=?", user.ID)).All(ctx, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		log.Printf("Update progress on node %d user: %d volume: %f progress: %f", req.NodeID, user.ID,
			req.Volume, req.Progress)
		if len(prgs) > 0 {
			p := prgs[0]
			p.Volume = null.Float32{Float32: req.Volume, Valid: true}
			p.Progress = null.Float32{Float32: req.Progress, Valid: true}

			_, err = p.Update(ctx, tx, boil.Infer())
			if reportInt(err, r, w) != nil {
				return
			}

			// Delete any duplicates
			for _, p := range prgs[1:] {
				_, err = p.Delete(ctx, tx)
				if reportInt(err, r, w) != nil {
					return
				}
			}
		} else {
			p := models.Progress{UserID: user.ID, NodeID: node.ID,
				Volume:   null.Float32{Float32: req.Volume, Valid: true},
				Progress: null.Float32{Float32: req.Progress, Valid: true}}

			err = p.Insert(ctx, tx, boil.Infer())
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
