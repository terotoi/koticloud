package fs

import (
	"github.com/terotoi/koticloud/server/models"
	"github.com/volatiletech/null/v8"
)

// NodeWithMeta contains models.Node data and associated metadata.
// Only one metum per returned node is supported.
type NodeWithMeta struct {
	models.Node `boil:",bind"`
	MetaType    null.String `boil:"meta_type"`
	MetaData    null.JSON   `boil:"meta.data"`
}
