package main

import (
	"flag"
	"fmt"
	"os"
	"strings"
)

const defaultBaseURL = "http://localhost:7070"

func usage() {
	fmt.Printf("Usage: koticli [options] <command> <args>\n")
	fmt.Printf("Options:\n")
	fmt.Printf("  -url <url>                        - server URL (default \"http://localhost:7070\")\n\n")

	fmt.Printf("Commands:\n")
	fmt.Printf("  login <username> <password>       - log in the server\n")
	fmt.Printf("  ls [path]                         - list a directory\n")
	fmt.Printf("  cd <path>                         - change remote directory\n")
	fmt.Printf("  cp <src> <dst>                    - copy a file or directory\n")
	fmt.Printf("  rm <path>                         - remove a file or directory\n")
	fmt.Printf("  rename <src> <dst>                - rename a file or directory\n")
	fmt.Printf("  mv <src> <dst>                    - move a file or directory\n")
	fmt.Printf("  mkdir <path>                      - create a directory\n")
	fmt.Printf("  info <path>                       - get information about a file or directory\n")
	fmt.Printf("  get <path>                        - download a file or directory\n")
	fmt.Printf("  upload <path>                     - upload a file or directory\n")
	fmt.Printf("  search <text>                     - search for files\n")

	fmt.Printf("\nadminstrator commands:\n")
	fmt.Printf("  create-user <username>            - add a new user to the system\n")
	fmt.Printf("  generate-thumbs                   - regenerate thumbnails\n")
	fmt.Printf("  scan-deleted                      - scan for physically deleted files\n")
	fmt.Printf("  scan                              - scan for new and physically deleted files\n")
	fmt.Printf("  setpassword <username> <password> - set a password for an user account\n")
}

func main() {
	baseURL := flag.String("url", defaultBaseURL, "server URL")
	flag.Parse()

	args := flag.Args()

	var err error

	app := App{BaseURL: "", RemoteDir: "/"}
	if err := app.loadUser(); err != nil && !os.IsNotExist(err) {
		fmt.Println(err.Error())
		return
	}

	if app.BaseURL == "" {
		app.BaseURL = *baseURL
	}
	app.BaseURL = strings.TrimRight(app.BaseURL, "/")

	aliases := map[string]string{
		"cp": "copy",
		"mv": "move",
		"rm": "delete",
	}

	fm := map[string]func(cmd string, args []string) error{
		"cd":              app.changeDir,
		"cp":              app.copy,
		"create-user":     app.createUser,
		"delete":          app.delete,
		"generate-thumbs": app.generateThumbnails,
		"get":             app.get,
		"info":            app.info,
		"login":           app.login,
		"ls":              app.list,
		"mkdir":           app.makeDir,
		"move":            app.copy,
		"rename":          app.rename,
		"scan-deleted":    app.scanDeleted,
		"scan":            app.scanAll,
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
	} else {
		usage()
	}

	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %s\n", strings.TrimRight(err.Error(), " \r\n\t"))
	}
}
