package core

import (
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"os"

	"github.com/terotoi/koticloud/server/util"
)

// ExtCommand specifies an external command to execute on a node.
type ExtCommand struct {
	ID           string   // ID of the command, used by client to execute the command
	Entry        string   // Name of the entry in the action menu
	ContentTypes []string `json:"content_types"` // List of applicable content types
	Command      string   // Command to execute on the server. %u is replaced by the content URL of the file
	SuccessText  string   `json:"success_text"`
	Admin        bool     // Admin access is required
}

// Config contains the application base configuration
type Config struct {
	ListenAddress string `json:"listen_address"` // In format [host]:port
	Database      string
	DataRoot      string `json:"data_root"`
	HomeRoot      string `json:"home_root"`
	ThumbRoot     string `json:"thumb_root"`
	UploadDir     string `json:"upload_dir"`
	StaticRoot    string `json:"static_root"`
	JWTSecret     string `json:"jwt_secret"`
	JWTMaxAge     int    `json:"jwt_max_age"` // Maximum age for the token, in hours. Use 0 for no age check.

	InitialUser string `json:"initial_user"`
	InitialPW   string `json:"initial_password"`

	ThumbMethod string `json:"thumb_method"`
	DevMode     bool

	ExtCommands []ExtCommand `json:"ext_commands"`
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

// ParseArgs parses command line arguments and loads the configuration file.
func ParseArgs() (*Config, error) {
	const defaultListenAddress = ":7070"

	var configFile, address, dbString, DataRoot, homeRoot, thumbRoot, uploadDir, StaticRoot string
	var save, devMode bool

	flag.StringVar(&configFile, "c", "$HOME/opt/koticloud/config_$HOSTNAME.json", "config file location")
	flag.BoolVar(&save, "save-config", false, "save configuraton file after argument parsing")
	flag.StringVar(&address, "address", "", "the address to listen on, in format [host]:port")
	flag.StringVar(&dbString, "db", "", "database config")
	flag.StringVar(&DataRoot, "data", "", "data directory")
	flag.StringVar(&homeRoot, "home", "", "root of user home directories")
	flag.StringVar(&thumbRoot, "thumbs", "", "root of the thumbnails directory")
	flag.StringVar(&uploadDir, "uploads", "", "upload directory")
	flag.StringVar(&StaticRoot, "static", "", "root directory for static files (optional)")
	flag.BoolVar(&devMode, "dev", false, "enter development mode")
	flag.Parse()

	if len(flag.Args()) == 0 {
		flag.Usage()
		return nil, fmt.Errorf("commands: scan, serve")
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

	if address != "" {
		cfg.ListenAddress = address
	}

	if cfg.ListenAddress == "" {
		cfg.ListenAddress = defaultListenAddress
	}

	cfg.DevMode = cfg.DevMode || devMode

	if cfg.HomeRoot == "" && cfg.DataRoot != "" {
		cfg.HomeRoot = cfg.DataRoot + "/home"
	}

	if cfg.ThumbRoot == "" && cfg.DataRoot != "" {
		cfg.ThumbRoot = cfg.DataRoot + "/thumbs"
	}

	if cfg.UploadDir == "" && cfg.DataRoot != "" {
		cfg.UploadDir = cfg.DataRoot + "/upload"
	}

	if cfg.StaticRoot == "" && cfg.DataRoot != "" {
		cfg.StaticRoot = cfg.StaticRoot + "/static"
	}

	cfg.DataRoot = util.ReplaceEnvs(cfg.DataRoot)
	cfg.HomeRoot = util.ReplaceEnvs(cfg.HomeRoot)
	cfg.ThumbRoot = util.ReplaceEnvs(cfg.ThumbRoot)
	cfg.UploadDir = util.ReplaceEnvs(cfg.UploadDir)
	cfg.StaticRoot = util.ReplaceEnvs(cfg.StaticRoot)

	log.Printf("Homeroot: %s", cfg.HomeRoot)
	log.Printf("Thumbfiles root: %s", cfg.ThumbRoot)
	log.Printf("Uploads: %s", cfg.UploadDir)
	log.Printf("Static dir: %s", cfg.StaticRoot)

	if _, err := os.Stat(cfg.StaticRoot); err != nil {
		return nil, err
	}

	return cfg, nil
}
