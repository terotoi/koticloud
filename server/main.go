package main

import (
	"context"
	"database/sql"
	"flag"
	"log"
	"net/http"
	"time"

	"github.com/go-chi/chi"
	"github.com/go-chi/chi/middleware"
	"github.com/terotoi/koticloud/server/core"
	"github.com/terotoi/koticloud/server/jobs"
	"github.com/terotoi/koticloud/server/proc"

	_ "github.com/lib/pq" // For PostgreSQL driver
)

// Connect to database and wait for it to become live.
func connectDB(config string) (*sql.DB, error) {
	const initialWait = 2
	const maxWait = 15

	db, err := sql.Open("postgres", config)
	if err != nil {
		return nil, err
	}

	dur := initialWait
	for {
		if err := db.Ping(); err != nil {
			log.Println(err)
		} else {
			break
		}

		log.Println("Waiting for the database to go live.")
		time.Sleep(time.Duration(dur) * time.Second)

		if dur < maxWait {
			dur++
		}
	}

	return db, nil
}

func main() {
	cfg, err := core.ParseArgs()
	if err != nil {
		log.Println(err)
		return
	}

	args := flag.Args()
	cmd := args[0]

	db, err := connectDB(cfg.Database)
	if err != nil {
		log.Println(err)
		return
	}

	if cfg.InitialUser != "" && cfg.InitialPW != "" {
		if err := createInitialUser(cfg.InitialUser, cfg.InitialPW, cfg.HomeRoot, db); err != nil {
			log.Println(err)
			return
		}
	}

	if cmd == "serve" {
		r := chi.NewRouter()
		r.Use(middleware.RequestID)
		r.Use(middleware.RealIP)
		r.Use(middleware.Logger)
		r.Use(middleware.Recoverer)
		r.Use(middleware.Timeout(60 * time.Second))

		np := proc.RunNodeProc(cfg.ThumbRoot, cfg.ThumbRoot, cfg.ThumbMethod, db)

		setupRoutes(r, cfg, np, db)

		addr := cfg.ListenAddress
		log.Printf("Listening on %s\n", addr)
		if err := http.ListenAndServe(addr, r); err != nil {
			log.Println(err)
		}
		np.End()
		np.WaitGroup.Wait()
	} else if cmd == "scan" {
		np := proc.RunNodeProc(cfg.ThumbRoot, cfg.ThumbRoot, cfg.ThumbMethod, db)
		err = jobs.ScanAllHomes(context.Background(), cfg, np, db)
		np.End()
		np.WaitGroup.Wait()

	} else {
		log.Printf("Unknown command: %s", cmd)
	}

	if err != nil {
		log.Println(err.Error())
		return
	}

	return
}
