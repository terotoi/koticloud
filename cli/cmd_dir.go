package main

import "fmt"

func (app *App) changeDir(cmd string, args []string) error {
	if len(args) > 0 {
		path := app.resolvePath(args[0])

		id, err := apiNodeIDForPath(path, app.AuthToken, app.BaseURL)
		if err != nil {
			return err
		}

		app.RemoteDirID = id
		app.RemoteDir = path
		app.saveConfig(true)
	}
	fmt.Printf("Current remote directory: %s\n", app.RemoteDir)
	return nil
}
