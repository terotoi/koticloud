package proc

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/terotoi/koticloud/server/models"
	"github.com/terotoi/koticloud/server/util"
	"github.com/volatiletech/null/v8"
)

// queryDuration returns the length of a video in seconds.
func queryVideoDuration(node *models.Node, filename string) error {
	filename = strings.Replace(filename, "$", "\\$", -1)

	cmd := fmt.Sprintf("ffprobe -v 0 -show_entries format=duration "+
		"-of default=noprint_wrappers=1:nokey=1 \"%s\"", filename)
	out, err := util.Exec(cmd)
	if err != nil {
		return err
	}

	d, err := strconv.ParseFloat(strings.Trim(string(out), " \n\t"), 32)
	if err != nil {
		return err
	}
	node.Length = null.Float64{Float64: d, Valid: true}
	return nil
}
