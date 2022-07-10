package util

import (
	"fmt"
	"os/exec"
	"strings"
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

// ShellEscape escapes a string for use in a shell command
func ShellEscape(text string) string {
	text = strings.ReplaceAll(text, `\`, `\\`)
	text = strings.ReplaceAll(text, " ", `\ `)
	text = strings.ReplaceAll(text, `'`, `\'`)
	text = strings.ReplaceAll(text, `$`, `\$`)
	text = strings.ReplaceAll(text, `(`, `\(`)
	text = strings.ReplaceAll(text, `)`, `\)`)
	text = strings.ReplaceAll(text, `[`, `\[`)
	text = strings.ReplaceAll(text, `]`, `\]`)
	text = strings.ReplaceAll(text, "`", "\\`")
	text = strings.ReplaceAll(text, `"`, `\"`)
	text = strings.ReplaceAll(text, `&`, `\&`)
	text = strings.ReplaceAll(text, "!", `\!`)
	text = strings.ReplaceAll(text, ";", `\;`)
	return text
}
