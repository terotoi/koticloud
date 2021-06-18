package api

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/jwtauth"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// Create a JWT access token. User object is required but node is optional.
// If a node is specified, the token will contain the node's ID and
// is assumed to be a node-specific access token.
func createToken(auth *jwtauth.JWTAuth, user *models.User, node *models.Node) (string, error) {
	token := map[string]interface{}{"user_id": user.ID, "updated": time.Now()}
	if node != nil {
		token["node_id"] = node.ID
	}
	_, t, err := auth.Encode(token)
	return t, err
}

// Extracts user ID from JWT token and finds the corresponding user object.
// If node_is exists in the token, extract will fail.
func userFromToken(ctx context.Context, db boil.ContextExecutor) (*models.User, error) {
	_, token, err := jwtauth.FromContext(ctx)
	if err != nil {
		return nil, err
	}

	if _, ok := token["node_id"]; ok {
		return nil, fmt.Errorf("node specific tokens not allowed")
	}

	uidf, ok := token["user_id"].(float64)
	if !ok {
		return nil, err
	}

	userID := int(uidf)
	user, err := models.Users(qm.Where("id=?", userID)).One(ctx, db)
	if err != nil {
		return nil, err
	}
	return user, nil
}

// Extracts user ID from JWT token and finds the corresponding user object.
// Also extracts a node ID and its corresponding object.
func userNodeFromToken(ctx context.Context, db boil.ContextExecutor) (*models.User, *models.Node, error) {
	_, token, err := jwtauth.FromContext(ctx)
	if err != nil {
		return nil, nil, err
	}

	uidf, ok := token["user_id"].(float64)
	if !ok {
		return nil, nil, fmt.Errorf("parse error")
	}

	userID := int(uidf)
	user, err := models.Users(qm.Where("id=?", userID)).One(ctx, db)
	if err != nil {
		return nil, nil, err
	}

	if _, ok = token["node_id"]; !ok {
		return user, nil, err
	}

	nif, ok := token["node_id"].(float64)
	if !ok {
		return nil, nil, fmt.Errorf("parse error")
	}

	nodeID := int(nif)
	node, err := fs.NodeByID(ctx, nodeID, db)
	if err != nil {
		return nil, nil, err
	}
	return user, node, nil
}

// Authorized creates a handler views needing an authorized user.
// If node_id is in the token, the access request will fail.
func Authorized(f func(user *models.User, w http.ResponseWriter, r *http.Request), requireAdmin bool, db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, err := userFromToken(r.Context(), db)
		if reportIf(err, http.StatusUnauthorized, "not authorized", r, w) != nil {
			log.Printf("Authorized: Illegal JWT for user.")
			return
		}

		if user == nil {
			reportInt(fmt.Errorf("user is nil"), r, w)
			log.Printf("Authorized: no user object found.")
			return
		}

		if requireAdmin && !user.Admin {
			report(fmt.Sprintf("Authorized: non-admin user %s tried to access admin procedure", user.Name),
				http.StatusUnauthorized, r, w)
			return
		}
		f(user, w, r)
	}
}

// Authorized creates a handler views needing an authorized user and a node.
// Node specific token is optional, but if it given, the node will be passed to the handler.
func AuthorizedNode(f func(user *models.User, node *models.Node, w http.ResponseWriter, r *http.Request), requireAdmin bool, db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, node, err := userNodeFromToken(r.Context(), db)
		if reportIf(err, http.StatusUnauthorized, "not authorized", r, w) != nil {
			log.Printf("Authorized: Illegal JWT for user.")
			return
		}

		if user == nil {
			reportInt(fmt.Errorf("user is nil"), r, w)
			log.Printf("Authorized: no user object found.")
			return
		}

		if requireAdmin && !user.Admin {
			report(fmt.Sprintf("Authorized: non-admin user %s tried to access admin procedure", user.Name),
				http.StatusUnauthorized, r, w)
			return
		}
		f(user, node, w, r)
	}
}
