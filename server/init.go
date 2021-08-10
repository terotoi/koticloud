package main

import (
	"context"
	"database/sql"
	"log"

	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/mx"
)

// Creates an initial user if there are no users in the database.
func createInitialUser(username, password, homeRoot string, db *sql.DB) error {
	ctx := context.Background()

	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	count, err := models.Users().Count(ctx, tx)
	if err != nil {
		return err
	}

	if count == 0 {
		log.Printf("No users in the database, creating an initial user: %s", username)

		if err := mx.UserCreate(ctx, username, password, true, homeRoot, tx); err != nil {
			return err
		}
	}

	if err := tx.Commit(); err != nil {
		return err
	}

	return nil
}
