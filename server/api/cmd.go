package api

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/go-chi/jwtauth"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/fs"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
)

type RunCommandRequest struct {
	CommandID string
	NodeID    int
}

// FunCommand executes an external command.
func RunCommand(auth *jwtauth.JWTAuth, cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		dec := json.NewDecoder(r.Body)

		var req RunCommandRequest
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		var command *core.ExtCommand
		for _, cmd := range cfg.ExtCommands {
			if cmd.ID == req.CommandID {
				command = &cmd
				break
			}
		}

		if command == nil {
			reportSystemError(fmt.Errorf("command not found"), r, w)
			return
		}

		if command.Admin && !user.Admin {
			reportUnauthorized("no access", r, w)
			return
		}

		ctx := r.Context()

		node, err := fs.NodeByID(ctx, req.NodeID, db)
		if reportSystemError(err, r, w) != nil {
			return
		}

		if !fs.AccessAllowed(user, node, false) {
			reportUnauthorized("no access", r, w)
			return
		}

		// Create a node-spcific access token.
		token, err := createToken(auth, user, node)
		if reportInt(err, r, w) != nil {
			return
		}

		url := fmt.Sprintf("\"/node/get/%d?jwt=%s\"", node.ID, token)

		line := strings.ReplaceAll(command.Command, "%u", url)
		if out, err := util.Exec(line); err != nil {
			log.Printf("Failed to execute command: %s Error: %s", line, err)
			reportInt(err, r, w)
		} else {
			log.Printf("Executed command: %s Output: %s", line, out)
			respJSON(command.SuccessText, r, w)
		}
	}
}
