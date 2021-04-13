package main

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/terotoi/koticloud/server/api"
	"github.com/terotoi/koticloud/server/models"
)

// apiSearch requests a list of nodes matching some criterion.
func apiSearch(text string, authToken, baseURL string) ([]*models.Node, error) {
	client := http.Client{}

	req := api.SearchRequest{
		Text: text,
	}

	resbody, err := PostJSON(&client, fmt.Sprintf("%s/node/search", baseURL), authToken, req)
	if err != nil {
		return nil, err
	}

	var nodes []*models.Node
	if err := json.Unmarshal(resbody, &nodes); err != nil {
		return nil, err
	}

	return nodes, nil
}
