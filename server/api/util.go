package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/terotoi/koticloud/server/core"
)

// If err is is not nil writes it to w. Returns err.
// detail is an optional detailed error message for the client. If "-" is given,
//   err.Error() is used
func reportIf(err error, statusCode int, detail string, r *http.Request, w http.ResponseWriter) error {
	if err != nil {
		message := err.Error()
		log.Printf("%s %s %s: %s", r.RemoteAddr, r.Method, r.URL.Path, message)

		w.Header().Add("Content-Type", "application/json")
		if detail == "-" {
			detail = message
		} else if detail == "" {
			detail = "internal server error"
		}

		w.WriteHeader(statusCode)
		w.Write([]byte(fmt.Sprintf("\"%s\"", detail)))
	}
	return err
}

// Shortcut for reporting internal server error without a custom user message.
func reportInt(err error, r *http.Request, w http.ResponseWriter) error {
	return reportIf(err, http.StatusInternalServerError, "", r, w)
}

func report(message string, statusCode int, r *http.Request, w http.ResponseWriter) {
	log.Printf("%s %s %s: %s", r.RemoteAddr, r.Method, r.URL.Path, message)

	w.Header().Add("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	w.Write([]byte(fmt.Sprintf("\"%s\"", message)))
}

// Shortcut for reporting unauthorized error without a custom user message.
func reportUnauthorized(msg string, r *http.Request, w http.ResponseWriter) {
	report(msg, http.StatusInternalServerError, r, w)
}

// Checks if the given error is a core.SystemError and if it is,
// reports the error using the message stored in the error.
// Otherwise reports an internal error.
func reportSystemError(err error, r *http.Request, w http.ResponseWriter) error {
	if serr, ok := err.(*core.SystemError); ok {
		reportIf(serr, serr.StatusCode, serr.UserMessage, r, w)
	} else {
		reportInt(err, r, w)
	}
	return err
}

// Writes JSON to writer and calls checkError on the result.
func respJSON(obj interface{}, r *http.Request, w http.ResponseWriter) error {
	w.Header().Add("Content-Type", "application/json")
	return reportIf(json.NewEncoder(w).Encode(obj), http.StatusInternalServerError,
		"json encode failed", r, w)
}
