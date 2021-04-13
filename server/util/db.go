package util

import (
	"context"
	"database/sql"
)

// WithTransaction begin a transaction, calls a funtion
// and if the function retruns nil, commits the transaction.
// If the function returns non-nil error, the transaction is rolled back
// and the error is returned.
func WithTransaction(ctx context.Context, db *sql.DB, f func(tx *sql.Tx) error) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	if err := f(tx); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	return nil
}
