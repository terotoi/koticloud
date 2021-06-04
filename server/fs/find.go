package fs

import (
	"context"
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// Returns all nodes.
func NodesAll(ctx context.Context, db boil.ContextExecutor) ([]*models.Node, error) {
	return models.Nodes().All(ctx, db)
}

// NodeByID returns a node by ID.
func NodeByID(ctx context.Context, id int, db boil.ContextExecutor) (*models.Node, error) {
	//node, err := models.Nodes(qm.Where("id=?", id)).One(ctx, db)
	node, err := models.FindNode(ctx, db, id)
	if err != nil {
		return nil, core.NewSystemError(http.StatusNotFound, err.Error(), fmt.Sprintf("node %d not found", id))
	}
	return node, err
}

// NodeWithMetaByID returns a node by ID.
func NodeWithMetaByID(ctx context.Context, nodeID, userID int, db boil.ContextExecutor) (*NodeWithMeta, error) {
	// NOTE: Current system supports only one metum per user-node.
	// This means that metadata on multiple users cannot be returned.
	var nwm NodeWithMeta
	err := models.NewQuery(
		qm.Select("nodes.*", "meta.type AS meta_type", "meta.data"),
		qm.From("nodes"),
		qm.LeftOuterJoin("meta on nodes.id=meta.node_id and meta.user_id=?", userID),
		qm.Where("nodes.id=?", nodeID)).Bind(ctx, db, &nwm)
	return &nwm, err
}

// NodesByParentID returns nodes with the given parent ID.
func NodesByParentID(ctx context.Context, parentID int, db boil.ContextExecutor) ([]*models.Node, error) {
	n, err := models.Nodes(qm.Where("parent_id=?", parentID)).All(ctx, db)
	return n, err
}

// NodesWithMetaByParentID returns nodes with the given parent ID.
// Associated metadata for the node and user is returned also.
func NodesWithMetaByParentID(ctx context.Context, parentID, userID int, db boil.ContextExecutor) ([]*NodeWithMeta, error) {
	// NOTE: Current system supports only one metum per user-node.
	// This means that metadata on multiple users cannot be returned.
	var nwm []*NodeWithMeta
	err := models.NewQuery(
		qm.Select("nodes.*", "meta.type AS meta_type", "meta.data"),
		qm.From("nodes"),
		qm.FullOuterJoin("meta on nodes.id=meta.node_id and meta.user_id=?", userID),
		qm.Where("parent_id=?", parentID)).Bind(ctx, db, &nwm)
	return nwm, err
}

// NodeLocalPath returns the path to the file containing file node's content.
// If includeFile is true, the filename is included in the path,
// otherwise the directory is returned, without trailing slash.
func NodeLocalPath(root string, id int, includeFile bool) string {
	if includeFile {
		return fmt.Sprintf("%s/%08d/%d", root, id/100*100, id)
	}
	return fmt.Sprintf("%s/%08d", root, id/100*100)
}

// NodeByIDopt returns a node by ID or nil if not found.
func NodeByIDopt(ctx context.Context, id int, db boil.ContextExecutor) (*models.Node, error) {
	nodes, err := models.Nodes(qm.Where("id=?", id)).All(ctx, db)
	if err != nil {
		return nil, err
	}
	if len(nodes) > 0 {
		return nodes[0], nil
	}
	return nil, nil
}

// NodeByPath parses a path and tries to find a node matching it.
// Returns nil, nil for not found error.
func NodeByPath(ctx context.Context, path string, root *models.Node, tx *sql.Tx) (*models.Node, error) {
	if path == "." || path == "" || path == "/" {
		return root, nil
	}

	node := root

	parts := strings.Split(path, "/")
	for _, p := range parts {
		if p == "" {
			continue
		}

		n, err := NodeChildByName(ctx, p, node.ID, tx)
		if err != nil {
			return nil, err
		}

		if n != nil {
			node = n
		} else {
			return nil, nil
		}
	}

	return node, nil
}

// NodeChildByName returns a child with the given name in the parent node.
// Returns nil, nil for not found error.
func NodeChildByName(ctx context.Context, name string, parentID int, tx *sql.Tx) (*models.Node, error) {
	n, err := models.Nodes(qm.Where("parent_id=?", parentID), qm.And("name=?", name)).All(ctx, tx)
	if err != nil {
		return nil, err
	}

	if len(n) > 0 {
		return n[0], nil
	}
	return nil, nil
}
