package mx

import (
	"context"
	"fmt"
	"log"

	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
	"golang.org/x/crypto/bcrypt"
)

// UserCreate creates an user object.
func UserCreate(ctx context.Context, username, password string, admin bool, homeRoot string, tx boil.ContextExecutor) error {
	pwhash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.MinCost)
	if err != nil {
		return nil
	}

	users, err := models.Users(qm.Where("name=?", username)).All(ctx, tx)
	if err != nil {
		return err
	}

	if users != nil {
		return fmt.Errorf("user already exists")
	}

	log.Printf("Creating new user: %s", username)

	user := &models.User{
		Name:     username,
		Password: null.String{String: string(pwhash), Valid: true},
		Admin:    admin,
	}

	err = user.Insert(ctx, tx, boil.Infer())
	if err != nil {
		return err
	}

	log.Printf("Creating root node for user %s", user.Name)
	_, err = UserEnsureRootNode(ctx, user, homeRoot, tx)
	if err != nil {
		return err
	}

	return nil
}

// UserEnsureRootNode makes sure that a root node exists for an users
// and creates it if it doesn't.
func UserEnsureRootNode(ctx context.Context, user *models.User, homeRoot string, tx boil.ContextExecutor) (*models.Node, error) {
	var node *models.Node
	var err error

	if !user.RootID.Valid {
		log.Printf("Creating a root node for user %s.", user.Name)
		node, err = fs.MakeDir(ctx, nil, user.Name, user, homeRoot, false, tx)
		if err != nil {
			return nil, err
		}

		user.RootID = null.Int{Int: node.ID, Valid: true}
		_, err = user.Update(ctx, tx, boil.Infer())
	} else {
		node, err = models.FindNode(ctx, tx, user.RootID.Int)
	}

	if err != nil {
		return nil, err
	}

	return node, nil
}
