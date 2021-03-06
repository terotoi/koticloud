package api

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"golang.org/x/crypto/bcrypt"

	"github.com/go-chi/jwtauth"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/mx"
	"github.com/volatiletech/null/v8"
	"github.com/volatiletech/sqlboiler/v4/boil"
	"github.com/volatiletech/sqlboiler/v4/queries/qm"
)

// LoginRequest is used for loggin in and getting the jwt auth token
type LoginRequest struct {
	Username string
	Password string
}

// LoginResponse contains information about the session after a succesful login.
type LoginResponse struct {
	Username      string
	AuthToken     string
	Admin         bool
	InitialNodeID int
}

// CreateUserRequest is used for creating users.
type CreateUserRequest struct {
	Username string
	Password string
}

// SetPasswordRequest is used for changing passwords.
type SetPasswordRequest struct {
	Username    string
	OldPassword string
	NewPassword string
}

// SettingsResponse is returned by QuerySettings().
type SettingsResponse struct {
	NamedCommands []struct {
		ID           string   // ID of the command
		Entry        string   // Name of the entry in the action menu
		ContentTypes []string // List of applicable content types
	}
}

// UserLogin logins in as an existing user.
func UserLogin(auth *jwtauth.JWTAuth, cfg *core.Config, db *sql.DB) func(w http.ResponseWriter, r *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest

		dec := json.NewDecoder(r.Body)
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

		user, err := models.Users(qm.Where("name=?", req.Username)).One(ctx, tx)
		if reportIf(err, http.StatusUnauthorized, "username or passsword mismatch", r, w) != nil {
			return
		}

		pwValid := user.Password.Valid &&
			bcrypt.CompareHashAndPassword([]byte(user.Password.String), []byte(req.Password)) == nil

		if !pwValid {
			report("username or passsword mismatch", http.StatusUnauthorized, r, w)
			return
		}

		var homeID int
		if user.RootID.Valid {
			homeID = user.RootID.Int
		} else {
			log.Printf("User %s (%d) has no home directory, creating one.", user.Name, user.ID)
			home, err := mx.UserEnsureRootNode(ctx, user, cfg.HomeRoot, tx)
			if reportIf(err, http.StatusInternalServerError, "failed to create a home directory", r, w); err != nil {
				return
			}
			homeID = home.ID
		}

		if err := reportInt(tx.Commit(), r, w); err != nil {
			return
		}

		// Create a JWT token
		token, err := createToken(auth, user, nil)
		if reportInt(err, r, w); err != nil {
			return
		}

		addr := r.Header.Get("X-Forwarded-For")
		if addr == "" {
			addr = r.RemoteAddr
		}
		log.Printf("User %s (%d) logged in from %s", user.Name, user.ID, addr)
		resp := LoginResponse{
			Username:      user.Name,
			AuthToken:     token,
			Admin:         user.Admin,
			InitialNodeID: homeID,
		}

		respJSON(resp, r, w)
	}
}

// UserCreate creates a new user.
func UserCreate(cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		var req CreateUserRequest
		dec := json.NewDecoder(r.Body)
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		log.Printf("User %s created by %s [%s]", req.Username, user.Name, r.Host)
		if err = mx.UserCreate(r.Context(), req.Username, req.Password, false, cfg.HomeRoot, db); err != nil {
			reportSystemError(err, r, w)
			return
		}

		respJSON(true, r, w)
	}
}

// SetPassword changes a password. Non-admins can only change their own password.
func SetPassword(db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		var req SetPasswordRequest

		dec := json.NewDecoder(r.Body)
		err := dec.Decode(&req)
		if reportIf(err, http.StatusBadRequest, "", r, w) != nil {
			return
		}

		if req.Username != user.Name && !user.Admin {
			report("admin access required", http.StatusUnauthorized, r, w)
			return
		}

		ctx := r.Context()
		tx, err := db.BeginTx(ctx, nil)
		if reportInt(err, r, w) != nil {
			return
		}
		defer tx.Rollback()

		username := req.Username
		if username == "" {
			username = user.Name
		}

		u, err := models.Users(qm.Where("name=?", username)).One(ctx, tx)
		if reportIf(err, http.StatusInternalServerError, "user not found", r, w) != nil {
			return
		}

		if !user.Admin || user.ID == u.ID {
			ok := (!u.Password.Valid && req.OldPassword == "") ||
				bcrypt.CompareHashAndPassword([]byte(user.Password.String), []byte(req.OldPassword)) == nil

			if !ok {
				report("old password mismatch", http.StatusUnauthorized, r, w)
				log.Printf("setpassword by %s failed: old password for mismatch for user %s",
					user.Name, u.Name)
				return
			}
		}

		newHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.MinCost)
		if reportInt(err, r, w) != nil {
			return
		}

		u.Password = null.String{String: string(newHash), Valid: true}
		_, err = u.Update(ctx, tx, boil.Infer())
		if reportInt(err, r, w) != nil {
			return
		}

		err = tx.Commit()
		if reportInt(err, r, w) != nil {
			return
		}

		log.Printf("Password changed for %s by %s [%s]", username, user.Name, r.Host)
		respJSON(true, r, w)
	}
}

// QuerySettings returns settings pertinent for the user.
func QuerySettings(cfg *core.Config, db *sql.DB) func(user *models.User, w http.ResponseWriter, r *http.Request) {
	return func(user *models.User, w http.ResponseWriter, r *http.Request) {
		var resp SettingsResponse

		for _, cmd := range cfg.ExtCommands {
			if user.Admin || !cmd.Admin {
				resp.NamedCommands = append(resp.NamedCommands, struct {
					ID           string
					Entry        string
					ContentTypes []string
				}{ID: cmd.ID,
					Entry:        cmd.Entry,
					ContentTypes: cmd.ContentTypes,
				})
			}
		}

		respJSON(resp, r, w)
	}
}
