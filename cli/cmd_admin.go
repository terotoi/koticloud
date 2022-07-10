package main

import (
	"fmt"
	"net/http"
)

func (app *App) scanDeleted(cmd string, args []string) error {
	client := http.Client{}

	_, err := PostJSON(&client, fmt.Sprintf("%s/admin/scan_deleted",
		app.BaseURL), app.AuthToken, nil)
	if err != nil {
		return err
	}

	fmt.Println("Scaning deleted started.")
	return nil
}

func (app *App) scanAll(cmd string, args []string) error {
	client := http.Client{}

	_, err := PostJSON(&client, fmt.Sprintf("%s/admin/scan_all",
		app.BaseURL), app.AuthToken, nil)
	if err != nil {
		return err
	}

	fmt.Println("Scan started.")
	return nil
}

func (app *App) generateThumbnails(cmd string, args []string) error {
	onlyMissing := "false"
	if len(args) > 0 && (args[0] == "-m" || args[0] == "--only-missing") {
		onlyMissing = "true"
	}

	client := http.Client{}

	_, err := PostJSON(&client, fmt.Sprintf("%s/admin/generate_thumbnails/"+onlyMissing,
		app.BaseURL), app.AuthToken, nil)
	if err != nil {
		return err
	}

	fmt.Println("Issued thumbnail regeneration request.")

	return nil
}
