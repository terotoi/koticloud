package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"github.com/terotoi/koticloud/server/api"
)

func (app *App) login(cmd string, args []string) error {
	if len(args) != 2 {
		fmt.Printf("Usage: login <username> [password]\n")
		return nil
	}

	req := api.LoginRequest{
		Username: args[0],
		Password: args[1],
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/user/login", app.BaseURL), "", req)
	if err != nil {
		return err
	}

	var resp *api.LoginResponse
	if err := json.Unmarshal(res, &resp); err != nil {
		return err
	}

	if resp == nil {
		fmt.Println("Login failed.")
	} else {
		app.Username = resp.Username
		app.AuthToken = resp.AuthToken
		app.RemoteDir = "/"

		if err := app.saveConfig(true); err != nil {
			return err
		}
		fmt.Printf("Logged in successfully.\n")
	}

	return nil
}

func (app *App) createUser(cmd string, args []string) error {
	if len(args) != 2 {
		fmt.Printf("Usage: create-user <username> <password>\n")
		return nil
	}

	username := args[0]
	password := args[1]

	create := api.CreateUserRequest{
		Username: username,
		Password: password,
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/user/create", app.BaseURL),
		app.AuthToken, &create)
	if err != nil {
		return err
	}

	ok, err := ParseBoolResponse(res)
	if err != nil {
		return err
	}

	if ok {
		fmt.Println("User created.")
	} else {
		fmt.Fprintf(os.Stderr, "Failed to create a user.")
	}
	return nil
}

func (app *App) setPassword(cmd string, args []string) error {
	if len(args) != 2 && len(args) != 3 {
		fmt.Printf("Usage: setpassword [username] [old-password] <new-password>\n")
		fmt.Printf("   To change own password, omit the username.\n")
		return nil
	}

	var username, oldPassword, newPassword string
	if len(args) == 3 {
		username = args[0]
		oldPassword = args[1]
		newPassword = args[2]
	} else {
		username = app.Username
		oldPassword = args[0]
		newPassword = args[1]
	}

	create := api.SetPasswordRequest{
		Username:    username,
		OldPassword: oldPassword,
		NewPassword: newPassword,
	}

	client := http.Client{}
	res, err := PostJSON(&client, fmt.Sprintf("%s/user/setpassword", app.BaseURL),
		app.AuthToken, &create)
	if err != nil {
		return err
	}

	ok, err := ParseBoolResponse(res)
	if err != nil {
		return err
	}

	if ok {
		fmt.Println("Password changed.")
	} else {
		fmt.Fprintf(os.Stderr, "Failed to change a password.")
	}
	return nil
}
