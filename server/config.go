package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/terotoi/koticloud/server/util"
)

// Config contains the application base configuration
type Config struct {
	Database   string
	DataRoot   string `json:"data_root"`
	FileRoot   string `json:"file_root"`
	ThumbRoot  string `json:"thumb_root"`
	UploadDir  string `json:"upload_dir"`
	StaticRoot string `json:"static_Root"`
	JWTSecret  string `json:"jwt_secret"`

	InitialUser string `json:"initial_user"`
	InitialPW   string `json:"initial_password"`

	ThumbMethod string `json:"thumb_method"`
	DevMode     bool
}

// loadConfig loads a config file from the given path.
func loadConfig(path string) (*Config, error) {
	cfg := Config{}
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	return &cfg, nil
}

// saveConfig saves configuration to a file
func saveConfig(cfg *Config, path string) error {
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	if err := ioutil.WriteFile(path, data, 0600); err != nil {
		return err
	}

	return nil
}

func parseArgs() (*Config, error) {
	var configFile, dbString, DataRoot, fileRoot, thumbRoot, uploadDir, StaticRoot string
	var save, devMode bool
	flag.StringVar(&configFile, "c", "$HOME/opt/koticloud/config_$HOSTNAME.json", "config file location")
	flag.BoolVar(&save, "save-config", false, "save configuraton file after argument parsing")
	flag.StringVar(&dbString, "db", "", "database config")
	flag.StringVar(&DataRoot, "data", "", "data directory")
	flag.StringVar(&fileRoot, "files", "", "root of the files directory")
	flag.StringVar(&thumbRoot, "thumbs", "", "root of the thumbnails directory")
	flag.StringVar(&uploadDir, "uploads", "", "upload directory")
	flag.StringVar(&StaticRoot, "static", "", "root directory for static files (optional)")
	flag.BoolVar(&devMode, "dev", false, "enter development mode")
	flag.Parse()

	if len(flag.Args()) == 0 {
		flag.Usage()
		return nil, fmt.Errorf("Commands: serve, create-admin")
	}

	configFile = util.ReplaceEnvs(configFile)

	cfg, err := loadConfig(configFile)
	if err != nil {
		if !os.IsNotExist(err) || !save {
			return nil, err
		}
		cfg = &Config{}
	}

	if dbString != "" {
		cfg.Database = dbString
	}

	if save {
		log.Printf("Saving configuration to %s", configFile)
		if err := saveConfig(cfg, configFile); err != nil {
			log.Printf("Failed to save config: %s", err.Error())
		}
	}

	cfg.DevMode = devMode

	if cfg.FileRoot == "" && cfg.DataRoot != "" {
		cfg.FileRoot = cfg.DataRoot + "/files"
	}

	if cfg.ThumbRoot == "" && cfg.DataRoot != "" {
		cfg.ThumbRoot = cfg.DataRoot + "/thumbs"
	}

	if cfg.UploadDir == "" && cfg.DataRoot != "" {
		cfg.UploadDir = cfg.DataRoot + "/files"
	}

	if cfg.StaticRoot == "" && cfg.DataRoot != "" {
		cfg.StaticRoot = cfg.StaticRoot + "/static"
	}

	cfg.DataRoot = util.ReplaceEnvs(cfg.DataRoot)
	cfg.FileRoot = util.ReplaceEnvs(cfg.FileRoot)
	cfg.ThumbRoot = util.ReplaceEnvs(cfg.ThumbRoot)
	cfg.UploadDir = util.ReplaceEnvs(cfg.UploadDir)
	cfg.StaticRoot = util.ReplaceEnvs(cfg.StaticRoot)

	log.Printf("Fileroot: %s", cfg.FileRoot)
	log.Printf("Thumbfiles root: %s", cfg.ThumbRoot)
	log.Printf("Uploads: %s", cfg.UploadDir)
	log.Printf("Static dir: %s", cfg.StaticRoot)

	if _, err := os.Stat(cfg.StaticRoot); err != nil {
		return nil, err
	}

	return cfg, nil
}
