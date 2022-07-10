package main

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/go-chi/chi"
	"github.com/go-chi/jwtauth"
	"github.com/terotoi/koticloud/server/api"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/jobs"
)

func serveStaticFiles(cfg *core.Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		if path == "/" {
			if cfg.DevMode {
				path = "/index_dev.html"
			} else {
				path = "/index.html"
			}
		} else if path == "/index_dev.html" && !cfg.DevMode {
			path = "/index.html"
		}

		log.Printf("Serving static file: %s -> %s", path, cfg.StaticRoot+path)
		http.ServeFile(w, r, cfg.StaticRoot+path)
	}
}

func setupRoutes(r *chi.Mux, cfg *core.Config, np *jobs.NodeProcessor, db *sql.DB) {
	auth := jwtauth.New("HS256", []byte(cfg.JWTSecret), nil)

	// Get JWT from 'jwt' query param, authentication header or cookie 'jwt'
	verifier := func(auth *jwtauth.JWTAuth) func(http.Handler) http.Handler {
		return func(next http.Handler) http.Handler {
			return jwtauth.Verify(auth, jwtauth.TokenFromQuery, jwtauth.TokenFromHeader, jwtauth.TokenFromCookie)(next)
		}
	}

	// Methods requiring JWT authentication.
	r.Group(func(r chi.Router) {
		r.Use(verifier(auth))
		r.Use(jwtauth.Authenticator)

		r.Post("/node/id_for", api.Authorized(api.NodeIDForPath(auth, db), false, cfg, db))
		r.Get("/node/ls/{nodeID:[0-9]+}", api.Authorized(api.NodeList(auth, db), false, cfg, db))
		r.Post("/node/mkdir", api.Authorized(api.NodeMakeDir(cfg, db), false, cfg, db))
		r.Post("/node/new", api.Authorized(api.NodeNew(cfg.UploadDir, cfg.HomeRoot, cfg.ThumbRoot, np.Channel, db),
			false, cfg, db))
		r.Post("/node/update", api.Authorized(api.NodeUpdate(cfg.UploadDir, cfg.HomeRoot, cfg.ThumbRoot, np.Channel, db),
			false, cfg, db))

		r.Get("/node/info/{nodeID:[0-9]+}", api.Authorized(api.NodeInfo(auth, db), false, cfg, db))
		r.Post("/node/copy", api.Authorized(api.NodeCopy(cfg.HomeRoot, cfg.ThumbRoot, db), false, cfg, db))
		r.Post("/node/move", api.Authorized(api.NodeMove(cfg, db), false, cfg, db))
		r.Post("/node/rename", api.Authorized(api.NodeRename(cfg, db), false, cfg, db))
		r.Post("/node/delete", api.Authorized(api.NodeDelete(cfg.HomeRoot, cfg.ThumbRoot, db),
			false, cfg, db))
		r.Post("/node/search", api.Authorized(api.NodeSearch(db), false, cfg, db))

		r.Post("/user/settings", api.Authorized(api.QuerySettings(cfg, db), false, cfg, db))
		r.Post("/user/create", api.Authorized(api.UserCreate(cfg, db), true, cfg, db))
		r.Post("/user/setpassword", api.Authorized(api.SetPassword(db), false, cfg, db))
		r.Post("/admin/scan_deleted",
			api.Authorized(api.ScanDeleted(np, cfg, db), true, cfg, db))
		r.Post("/admin/scan_all",
			api.Authorized(api.ScanAll(np, cfg, db), true, cfg, db))
		r.Post("/admin/generate_thumbnails/{onlyMissing}",
			api.Authorized(api.GenerateAllThumbnails(np, cfg.HomeRoot, db), true, cfg, db))

		r.Get("/node/get/{nodeID:[0-9]+}",
			api.AuthorizedNode(api.NodeGet(cfg.HomeRoot, db), false, cfg, db))

		// Thumbnails are only served, if the respective node has "has_custom_thumb" true
		r.Get("/node/thumb/{nodeID:[0-9]+}", api.AuthorizedNode(api.ThumbGet(cfg, db), false, cfg, db))

		r.Post("/progress/update", api.Authorized(api.UpdateProgress(db), false, cfg, db))

		// Execute a name command.
		r.Post("/cmd/run", api.Authorized(api.RunCommand(auth, cfg, db), false, cfg, db))
	})

	staticFiles := serveStaticFiles(cfg)

	// Methods not requiring JWT authentication.
	r.Group(func(r chi.Router) {
		r.Post("/user/login", api.UserLogin(auth, cfg, db))

		r.Get("/id/{nodeID:[0-9]+}", func(w http.ResponseWriter, r *http.Request) {
			r.URL.Path = "/"
			staticFiles(w, r)
		})

		if cfg.StaticRoot != "" {
			log.Printf("Serving static files from %s", cfg.StaticRoot)
			r.Get("/*", staticFiles)
		}
	})
}
