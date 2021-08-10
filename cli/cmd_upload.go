package main

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/terotoi/koticloud/server/models"
)

func (app *App) uploadFile(path, targetPath string) error {
	st, err := os.Stat(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "cannot stat %s: %s\n", path, err)
		return nil
	}

	filename := filepath.Base(path)

	if st.Mode().IsRegular() {
		var nodes []*models.Node
		nodes, err = apiUpload(path, targetPath, app.AuthToken, app.BaseURL)

		herror, ok := err.(*HTTPError)
		if ok && herror.StatusCode == http.StatusConflict {
			fmt.Fprintf(os.Stderr, "file already exists: %s\n", filename)
			return nil
		} else if err == nil {
			for _, node := range nodes {
				printNode(node, true)
			}
		}
	} else {
		fmt.Fprintf(os.Stderr, "not a file, skipping: %s\n", path)
	}
	return err
}

func (app *App) upload(cmd string, args []string) error {
	if len(args) == 0 {
		fmt.Println("Usage: upload [-l] [-r] <file> [files...]")
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

	if !recursive {
		for _, path := range rest {
			abs, err := filepath.Abs(path)
			if err != nil {
				return err
			}

			fmt.Printf("Uploading %s to %s\n", abs, app.RemoteDir)
			printNodeHeader()
			if err := app.uploadFile(abs, app.RemoteDir); err != nil {
				return err
			}
		}
	} else {
		for _, root := range rest {
			rootAbs, err := filepath.Abs(root)
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				continue
			}

			rootAbs = filepath.Dir(rootAbs) + "/"

			err =
				filepath.Walk(root, func(path string, info os.FileInfo, err error) error {
					if err != nil {
						fmt.Fprintf(os.Stderr, ": %s: %s\n", root, err)
						return nil
					}

					abs, err := filepath.Abs(path)
					if err != nil {
						fmt.Fprintln(os.Stderr, err)
						return err
					}

					base := strings.TrimPrefix(abs, rootAbs)
					targetPath := app.resolvePath(base)

					if info.Mode().IsRegular() {
						targetPath = filepath.Dir(targetPath)

						err = app.uploadFile(abs, targetPath)
						if err != nil {
							fmt.Fprintf(os.Stderr, "got error, aborting\n")
							return err
						}
					} else if info.IsDir() {
						filename := filepath.Base(abs)
						_, err = apiMakeDir(targetPath, app.AuthToken, app.BaseURL)

						herror, ok := err.(*HTTPError)
						if ok && herror.StatusCode == http.StatusConflict {
							fmt.Fprintf(os.Stderr, "directory already exists: %s\n", filename)
							return nil
						} else if err != nil {
							return err
						} else {
							fmt.Printf("Directory created: %s\n", filename)
						}
					} else {
						fmt.Fprintf(os.Stderr, "Skipping: %s\n", path)
					}
					return nil
				})

			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				return err
			}
		}
	}

	return nil
}
