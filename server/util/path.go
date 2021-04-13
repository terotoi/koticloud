package util

import (
	"fmt"
	"os"
	"strings"
)

// EnsureDirExists makes sure that there exists a directory for storing the given
// file in the local filesystem.
func EnsureDirExists(path string) error {
	st, err := os.Stat(path)
	if err != nil && !os.IsNotExist(err) {
		return err
	}

	if os.IsNotExist(err) {
		return os.MkdirAll(path, 0770)
	}

	if !st.Mode().IsDir() {
		return fmt.Errorf("%s: is not a directory", path)
	}

	return nil
}

// ReplaceEnvs replaces some environment variable references with their contents.
// Currently supported: $HOME and $HOSTNAME.
func ReplaceEnvs(s string) string {
	homeDir := os.Getenv("HOME")
	hostname := os.Getenv("HOSTNAME")
	s = strings.Replace(s, "$HOME", homeDir, -1)
	s = strings.Replace(s, "$HOSTNAME", hostname, -1)
	return s
}
