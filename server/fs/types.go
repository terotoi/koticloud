package fs

import (
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
)

// NodeWithProgress contains models.Node data and associated progress data..
type NodeWithProgress struct {
	models.Node `boil:",bind"`
	Progress    null.Float32 `boil:"progress.progress" json:"progress"`
	Volume      null.Float32 `boil:"progress.volume" json:"volume"`
}
