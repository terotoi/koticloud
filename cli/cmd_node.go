package main

import (
	"fmt"
	"log"
	"path/filepath"
	"strconv"
	"strings"
)

func (app *App) info(cmd string, args []string) error {
	if len(args) == 0 {
		fmt.Println("Usage: info <nodeid>")
		return nil
	}

	id, err := strconv.Atoi(args[0])
	if err != nil {
		return err
	}

	node, err := apiInfo(id, app.AuthToken, app.BaseURL)
	if err != nil {
		return err
	}
	printNodeHeader()
	printNodeWithProgress(node)
	return nil
}

func (app *App) list(cmd string, args []string) error {
	path := app.RemoteDir
	if len(args) > 0 {
		path = app.resolvePath(args[0])
	}

	fmt.Printf("Listing path: %s\n", path)

	_, nodes, err := apiList(path, app.AuthToken, app.BaseURL)
	if err != nil {
		return err
	}

	if nodes == nil {
		fmt.Printf("No nodes.\n")
	} else {
		printNodeHeader()
		for _, node := range nodes {
			printNodeWithProgress(node)
		}
	}
	return nil
}

func (app *App) makeDir(cmd string, args []string) error {
	if len(args) == 0 {
		return fmt.Errorf("pathname required")
	}
	path := app.resolvePath(args[0])

	_, err := apiMakeDir(path, app.AuthToken, app.BaseURL)
	if err != nil {
		return err
	}
	fmt.Printf("Directory created: %s\n", path)
	return nil
}

func (app *App) get(cmd string, args []string) error {
	if len(args) == 0 {
		fmt.Println("Usage: get <nodeid> [nodeid...]")
		return nil
	}

	for _, arg := range args {
		id, err := strconv.Atoi(arg)
		if err != nil {
			log.Println(err)
			continue
		}

		filename, err := apiGet(id, app.AuthToken, app.BaseURL)
		if err != nil {
			log.Println(err)
		} else {
			fmt.Printf("get: %d -> %s\n", id, filename)
		}
	}
	return nil
}

func (app *App) copy(cmd string, args []string) error {
	if len(args) != 2 {
		fmt.Printf("Usage: %s <srcpath> <dstpath>", cmd)
		return nil
	}

	srcPath := app.resolvePath(args[0])
	dstPath := app.resolvePath(args[1])

	var filename string
	if strings.HasSuffix(dstPath, "/") {
		filename = filepath.Base(srcPath)
		dstPath = strings.TrimSuffix(dstPath, "/")
	} else {
		filename = filepath.Base(dstPath)
		dstPath = filepath.Dir(dstPath)
	}

	nodes, err := apiCopy(srcPath, dstPath, filename, cmd == "move", app.AuthToken, app.BaseURL)

	if err != nil {
		fmt.Println(err)
	} else {
		fmt.Printf("Copied %d nodes:\n", len(nodes))
		printNodeHeader()
		for _, n := range nodes {
			printNode(n, true)
		}
	}
	return nil
}

func (app *App) rename(cmd string, args []string) error {
	if len(args) != 2 {
		fmt.Println("Usage: rename <path> <new name>")
		return nil
	}

	path := app.resolvePath(args[0])
	newName := args[1]

	nodes, err := apiRename(path, newName, app.AuthToken, app.BaseURL)
	if err != nil {
		fmt.Println(err.Error())
	} else {
		fmt.Printf("Renamed %d nodes:\n", len(nodes))
		printNodeHeader()
		for _, n := range nodes {
			printNode(&n, true)
		}
	}
	return nil
}

func (app *App) delete(cmd string, args []string) error {
	if len(args) == 0 {
		fmt.Println("Usage: delete <path> [path...]")
		return nil
	}

	var recursive bool
	var rest []string
	for _, arg := range args {
		if arg == "-r" {
			recursive = true
		} else {
			rest = append(rest, arg)
		}
	}

	for _, arg := range rest {
		path := app.resolvePath(arg)

		nodes, err := apiDelete(path, recursive, app.AuthToken, app.BaseURL)
		if err != nil {
			fmt.Println(err.Error())
		} else {
			fmt.Printf("Deleted %d nodes:\n", len(nodes))
			printNodeHeader()
			for _, n := range nodes {
				printNode(&n, true)
			}
		}
	}
	return nil
}

func (app *App) search(cmd string, args []string) error {
	if len(args) > 0 {
		nodes, err := apiSearch(strings.Join(args, " "), app.AuthToken, app.BaseURL)
		if err != nil {
			return err
		}

		if nodes == nil {
			fmt.Printf("No matching nodes.\n")
		} else {
			printNodeHeader()
			for _, node := range nodes {
				printNode(node, true)
			}
		}
	}
	return nil
}
