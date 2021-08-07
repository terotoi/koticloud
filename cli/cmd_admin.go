package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/terotoi/koticloud/server/models"
)

func (app *App) scanDeleted(cmd string, args []string) error {
	client := http.Client{}

	res, err := PostJSON(&client, fmt.Sprintf("%s/admin/scan_deleted",
		app.BaseURL), app.AuthToken, nil)
	if err != nil {
		return err
	}

	var nodes []models.Node
	if err := json.Unmarshal(res, &nodes); err != nil {
		return err
	}

	fmt.Printf("Deleted unexisting nodes:\n")
	printNodeHeader()
	for _, n := range nodes {
		printNode(&n, true)
	}
	return nil
}

func (app *App) generateThumbnails(cmd string, args []string) error {
	client := http.Client{}

	_, err := PostJSON(&client, fmt.Sprintf("%s/admin/generate_thumbnails",
		app.BaseURL), app.AuthToken, nil)
	if err != nil {
		return err
	}

	fmt.Println("Issued thumbnail regeneration request.")

	return nil
}
