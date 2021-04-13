package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

const defaultBaseURL = "http://localhost:7070"

func main() {
	baseURL := flag.String("base", defaultBaseURL, "base URL")
	flag.Parse()

	*baseURL = strings.TrimRight(*baseURL, "/")

	args := flag.Args()

	var err error

	app := App{BaseURL: *baseURL, RemoteDir: "/"}
	if err := app.loadUser(); err != nil && !os.IsNotExist(err) {
		fmt.Println(err.Error())
		return
	}

	aliases := map[string]string{
		"cp": "copy",
		"mv": "move",
		"rm": "delete",
	}

	fm := map[string]func(cmd string, args []string) error{
		"cd":              app.changeDir,
		"copy":            app.copy,
		"create-user":     app.createUser,
		"delete":          app.delete,
		"generate_thumbs": app.generateThumbnails,
		"get":             app.get,
		"info":            app.info,
		"login":           app.login,
		"ls":              app.list,
		"mkdir":           app.makeDir,
		"move":            app.copy,
		"rename":          app.rename,
		"scan-deleted":    app.scanDeleted,
		"search":          app.search,
		"setpassword":     app.setPassword,
		"upload":          app.upload,
	}

	if len(args) > 0 {
		cmd := args[0]
		cmdargs := args[1:]

		if _, ok := aliases[cmd]; ok {
			cmd = aliases[cmd]
		}

		if f, ok := fm[cmd]; ok {
			err = f(cmd, cmdargs)
		} else {
			fmt.Fprintf(os.Stderr, "Unknown command: %s\n", cmd)
		}
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %s\n", strings.TrimRight(err.Error(), " \r\n\t"))
	}
}
