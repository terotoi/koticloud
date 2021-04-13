package util

import (
	"fmt"
	"os/exec"
)

// Exec executes a shell command using /bin/bash.
// Returns the output and error.
func Exec(command string) (string, error) {
	cmd := exec.Command("/bin/bash", "-c", command)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("%s: %s", err.Error(), string(out))
	}
	return string(out), nil
}
