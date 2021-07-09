package api

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/jwtauth"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/sqlboiler/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// Create a JSON Web Token. User object is required but node is optional.
// If a node is specified, the token will contain the node's ID and
// is assumed to be a node-specific access token.
func createToken(auth *jwtauth.JWTAuth, user *models.User, node *models.Node) (string, error) {
	token := map[string]interface{}{"user_id": user.ID, "created": time.Now().Format(time.RFC3339)}
	fmt.Printf("created: %s\n", token["created"])
	if node != nil {
		token["node_id"] = node.ID
	}
	_, t, err := auth.Encode(token)
	return t, err
}

// Extracts user ID and node ID from JWT token and finds the corresponding user and node object.
// Checks for token validity.
func userNodeFromToken(ctx context.Context, tokenMaxAge int, db boil.ContextExecutor) (*models.User, *models.Node, error) {
	_, token, err := jwtauth.FromContext(ctx)
	if err != nil {
		return nil, nil, err
	}

	// Check that the token is not too old.
	if created, ok := token["created"]; !ok {
		return nil, nil, fmt.Errorf("token has no created field")
	} else {
		t, err := time.Parse(time.RFC3339, created.(string))
		if err != nil {
			return nil, nil, err
		}

		if tokenMaxAge > 0 && time.Now().Sub(t) > (time.Hour*time.Duration(tokenMaxAge)) {
			return nil, nil, fmt.Errorf("token is too old")
		}
	}

	// Extract the user ID.
	uidf, ok := token["user_id"].(float64)
	if !ok {
		return nil, nil, err
	}

	// Find corresponding User object.
	userID := int(uidf)
	user, err := models.Users(qm.Where("id=?", userID)).One(ctx, db)
	if err != nil {
		return nil, nil, err
	}

	// Extract the node ID.
	if nif, ok := token["node_id"].(float64); ok {
		nodeID := int(nif)
		node, err := fs.NodeByID(ctx, nodeID, db)
		if err != nil {
			return nil, nil, err
		}

		return user, node, nil
	}

	return user, nil, nil
}

// Authorized creates a handler views needing an authorized user.
// If node_id is in the token, the access request will fail.
func Authorized(f func(user *models.User, w http.ResponseWriter, r *http.Request),
	requireAdmin bool, cfg *core.Config, db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, node, err := userNodeFromToken(r.Context(), cfg.JWTMaxAge, db)
		if reportIf(err, http.StatusUnauthorized, "not authorized", r, w) != nil {
			log.Printf("Authorized: Illegal JWT for user.")
			return
		}

		if node != nil {
			reportInt(fmt.Errorf("node is not nil"), r, w)
			log.Printf("Authorized: node_id not allowed in the token.")
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
func AuthorizedNode(f func(user *models.User, node *models.Node, w http.ResponseWriter, r *http.Request),
	requireAdmin bool, cfg *core.Config, db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user, node, err := userNodeFromToken(r.Context(), cfg.JWTMaxAge, db)
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
