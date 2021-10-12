package fs

import "github.com/terotoi/koticloud/server/models"

// Checks if the given user has access to the given node.
func AccessAllowed(user *models.User, node *models.Node, write bool) bool {
	return user.Admin || (node.OwnerID.Valid && node.OwnerID.Int == user.ID)
}
