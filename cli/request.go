package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"net/http"
	"strings"
)

// RequestURL does a GET or POST request.
// If w is not nil, the response body is copied to that writer. Otherwise
// the body is returned as byte array.
func RequestURL(client *http.Client, url, contentType, authToken string, body []byte,
	w io.Writer) ([]byte, error) {
	var err error
	var req *http.Request

	if body != nil {
		bodyIO := bytes.NewReader(body)
		req, err = http.NewRequest("POST", url, bodyIO)
	} else {
		req, err = http.NewRequest("GET", url, nil)
	}

	if err != nil {
		return nil, err
	}

	req.Header.Add("Content-Type", contentType)

	if authToken != "" {
		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", authToken))
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}
		return nil, httpError(resp.StatusCode, fmt.Sprintf("[%d] %s", resp.StatusCode, strings.Trim(string(body), " \r\n\t")))
	}

	if w != nil {
		_, err := io.Copy(w, resp.Body)
		return nil, err
	}

	inBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return inBody, nil
}

// PostJSON sends a POST request with JSON body.
func PostJSON(client *http.Client, url, authToken string, body interface{}) ([]byte, error) {
	data, err := json.Marshal(body)
	if err != nil {
		return nil, err
	}

	return RequestURL(client, url, "application/json", authToken, data, nil)
}

// ParseBoolResponse parses a JSON response which contains a single boolean.
func ParseBoolResponse(data []byte) (bool, error) {
	var ok bool
	if err := json.Unmarshal(data, &ok); err != nil {
		return false, err
	}

	return ok, nil
}
