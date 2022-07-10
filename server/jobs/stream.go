package jobs

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
)

// queryDuration returns the length of a video in seconds.
func queryVideoDuration(node *models.Node, filename string) (float64, error) {
	filename = util.ShellEscape(filename)

	cmd := fmt.Sprintf("ffprobe -v 0 -show_entries format=duration "+
		"-of default=noprint_wrappers=1:nokey=1 %s", filename)
	out, err := util.Exec(cmd)
	if err != nil {
		return 0, err
	}

	d, err := strconv.ParseFloat(strings.Trim(string(out), " \n\t"), 32)
	if err != nil {
		return 0, err
	}
	return d, nil
}
