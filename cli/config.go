package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
)

const configFile = "%s/client.json"

// UserConfig is contains user authentication data for the client
// and the current remote directory.
type UserConfig struct {
	Username  string
	AuthToken string
	RemoteDir string
}

func getConfigDir() string {
	configDir := os.Getenv("XDG_CONFIG_HOME")
	if configDir == "" {
		home := os.Getenv("HOME")
		configDir = fmt.Sprintf("%s/.config/koticloud", home)
	}
	return configDir
}

func (app *App) loadUser() error {
	configDir := getConfigDir()

	data, err := ioutil.ReadFile(fmt.Sprintf(configFile, configDir))
	if err != nil {
		return err
	}

	var config UserConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return err
	}

	app.Username = config.Username
	app.AuthToken = config.AuthToken
	app.RemoteDir = config.RemoteDir
	if app.RemoteDir == "" {
		app.RemoteDir = "/"
	}
	return nil
}

func (app *App) saveConfig(createDir bool) error {
	configDir := getConfigDir()

	_, err := os.Stat(configDir)
	if os.IsNotExist(err) && createDir {
		if err := os.MkdirAll(configDir, 0700); err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	config := UserConfig{
		Username:  app.Username,
		AuthToken: app.AuthToken,
		RemoteDir: app.RemoteDir,
	}

	var data []byte
	if data, err = json.Marshal(&config); err != nil {
		return err
	}

	return ioutil.WriteFile(fmt.Sprintf(configFile, configDir),
		data, 0600)
}
