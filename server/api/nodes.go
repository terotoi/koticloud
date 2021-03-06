package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/go-chi/chi"
	"github.com/go-chi/jwtauth"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// ListDirResponse is contains the directory node
// and its children.
type ListDirResponse struct {
	Dir      models.Node
	DirPath  string // Full path of the directory
	Children []*fs.NodeWithProgress
}

// CopyRequest requests copying of a node to a directory.
// DestID is the parent node ID. It can be the same as the
// current parent, provided that NewName differs.
type CopyRequest struct {
	SourceID int
	DestID   int
	NewName  string
}

// MoveRequest requests copying of a node to a directory.
// DestID is the parent node ID.
type MoveRequest struct {
	SourceID int
	DestID   int
}

// DeleteRequest requests deletion of a node, potentially
// recursively.
type DeleteRequest struct {
	ID        int
	Recursive bool
}

// RenameRequest requests renaming of a node.
type RenameRequest struct {
	ID      int
	NewName string
}

// MakeDirRequest requests a creationg of a directory.
type MakeDirRequest struct {
	ParentID int
	Name     string
}

// NodeIDForPath returns an ID for a path relative to the user's root directory.
// output: {int} id
func NodeIDForPath(auth *jwtauth.JWTAuth, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var path string
		err := dec.Decode(&path)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()
		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		var root *models.Node
		if user.RootID.Valid {
			root, err = fs.NodeByID(ctx, user.RootID.Int, tx)
			if reportSystemError(err, r, w) != nil {
				return
			}
		} else {
			report("user has no valid home directory", http.StatusInternalServerError, r, w)
			return
		}

		node, err := fs.NodeByPath(ctx, path, root, tx)
		if reportSystemError(err, r, w) != nil {
			return
		}

		if node == nil {
			report(fmt.Sprintf("not found: %s", path), http.StatusNotFound, r, w)
			return
		}

		if !fs.AccessAllowed(user, node, false) {
			reportUnauthorized("no access", r, w)
			return
		}

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		if node != nil {
			respJSON(node.ID, r, w)
		} else {
			report(fmt.Sprintf("path not found: %s", path), http.StatusNotFound, r, w)
		}
	}
}

// NodeInfo returns information on one node.
func NodeInfo(auth *jwtauth.JWTAuth, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()

		id, err := strconv.Atoi(chi.URLParam(r, "nodeID"))
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		nwm, err := fs.NodeWithProgressByID(ctx, id, user.ID, db)
		if reportInt(err, r, w) != nil {
			return
		}

		if !fs.AccessAllowed(user, &nwm.Node, false) {
			reportUnauthorized("no access", r, w)
			return
		}

		if reportInt(err, r, w) != nil {
			return
		}
		respJSON(&nwm, r, w)
	}
}

// NodeList returns a directory listing of a path.
func NodeList(auth *jwtauth.JWTAuth, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		id, err := strconv.Atoi(chi.URLParam(r, "nodeID"))
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()

		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		if !user.RootID.Valid {
			log.Printf("User %s (%d) has no valid home directory.", user.Name, user.ID)
			respJSON(nil, r, w)
		} else {
			node, err := models.FindNode(ctx, tx, id)
			if reportInt(err, r, w) != nil {
				return
			}

			if !fs.AccessAllowed(user, node, false) {
				reportUnauthorized("no access", r, w)
				return
			}

			path, err := fs.PathFor(ctx, node, tx)
			if reportInt(err, r, w) != nil {
				return
			}

			nwm, err := fs.NodesWithProgressByParentID(ctx, node.ID, user.ID, db)
			if reportInt(err, r, w) != nil {
				return
			}

			if reportInt(tx.Commit(), r, w) != nil {
				return
			}

			resp := ListDirResponse{
				Dir:      *node,
				DirPath:  path,
				Children: nwm,
			}

			respJSON(resp, r, w)
		}
	}
}

// NodeMakeDir creates a new diectory..
func NodeMakeDir(cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)
		var req MakeDirRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		if !fs.IsValidName(req.Name) {
			report(fmt.Sprintf("invalid node name: %s", req.Name), http.StatusBadRequest, r, w)
			return
		}

		ctx := r.Context()

		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		parent, err := models.Nodes(qm.Where("id=?", req.ParentID)).One(ctx, tx)
		if reportIf(err, http.StatusNotFound, "", r, w) != nil {
			return
		}

		if parent == nil {
			reportIf(fmt.Errorf("node not found: %d", req.ParentID), http.StatusNotFound, "-", r, w)
			return
		}

		if !fs.AccessAllowed(user, parent, true) {
			reportUnauthorized("no access", r, w)
			return
		}

		if !fs.IsDir(parent) {
			report("parent is not a directory", http.StatusBadRequest, r, w)
			return
		}

		dup, err := fs.NodeChildByName(r.Context(), req.Name, parent.ID, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		if dup != nil {
			report(fmt.Sprintf("duplicate directory %s in path %s", req.Name, parent.Name),
				http.StatusConflict, r, w)
			return
		}

		node, err := fs.MakeDir(r.Context(), parent, req.Name, user, cfg.HomeRoot, false, tx)
		if reportInt(err, r, w) != nil {
			return
		}

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		log.Printf("Directory created %s/%s", parent.Name, node.Name)
		respJSON(node, r, w)
	}
}

// NodeCopy copies a node to a possibly different parent.
func NodeCopy(homeRoot, thumbRoot string, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req CopyRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()
		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		src, err := models.FindNode(ctx, tx, req.SourceID)
		if reportIf(err, http.StatusNotFound, fmt.Sprintf("node not found: %d", req.SourceID), r, w) != nil {
			return
		}

		dest, err := models.FindNode(ctx, tx, req.DestID)
		if reportIf(err, http.StatusNotFound, fmt.Sprintf("node not found: %d", req.DestID), r, w) != nil {
			return
		}

		copied, err := fs.Copy(ctx, src, dest, req.NewName, homeRoot, thumbRoot,
			user, tx)
		if err != nil {
			reportSystemError(err, r, w)
			return
		}

		if reportInt(tx.Commit(), r, w) != nil {
			return
		}

		respJSON(copied, r, w)
	}
}

// NodeMove moves a node under a new parent node.
func NodeMove(cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req MoveRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()
		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		node, err := fs.NodeWithProgressByID(ctx, req.SourceID, user.ID, tx)
		if reportIf(err, http.StatusNotFound, fmt.Sprintf("node not found: %d", req.SourceID), r, w) != nil {
			return
		}

		dest, err := models.FindNode(ctx, tx, req.DestID)
		if reportIf(err, http.StatusNotFound, fmt.Sprintf("node not found: %d", req.DestID), r, w) != nil {
			return
		}

		if err = fs.Move(ctx, &node.Node, dest, user, cfg.HomeRoot, tx); err != nil {
			reportSystemError(err, r, w)
			return
		}

		if reportInt(tx.Commit(), r, w) != nil {
			return
		}

		respJSON([]*fs.NodeWithProgress{node}, r, w)
	}
}

// NodeRename renames a node.
func NodeRename(cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req RenameRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()

		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		node, err := fs.NodeWithProgressByID(ctx, req.ID, user.ID, tx)
		if reportIf(err, http.StatusNotFound, fmt.Sprintf("node not found: %d", req.ID), r, w) != nil {
			return
		}

		if err = fs.Rename(ctx, &node.Node, req.NewName, user, cfg.HomeRoot, tx); err != nil {
			reportSystemError(err, r, w)
			return
		}

		if reportInt(tx.Commit(), r, w) != nil {
			return
		}

		respJSON([]*fs.NodeWithProgress{node}, r, w)
	}
}

// NodeDelete deletes a node.
func NodeDelete(homeRoot, thumbRoot string, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req DeleteRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		ctx := r.Context()

		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		node, err := models.FindNode(ctx, tx, req.ID)
		if reportIf(err, http.StatusNotFound, fmt.Sprintf("node not found: %d", req.ID), r, w) != nil {
			return
		}

		deleted, err := fs.Delete(ctx, node, req.Recursive, user, homeRoot, thumbRoot, tx)
		if err != nil {
			reportSystemError(err, r, w)
			return
		}

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		for _, n := range deleted {
			path, err := fs.PhysPath(ctx, n, homeRoot, tx)
			if err != nil {
				log.Printf("Deleted %s %d %s", n.Type, n.ID, path)
			}
		}

		respJSON(deleted, r, w)
	}
}
