package core

import "net/http"

// SystemError passes the error message, user visible error message and HTTP status code.
type SystemError struct {
	Message     string
	UserMessage string
	StatusCode  int
}

func (e *SystemError) Error() string {
	return e.Message
}

func NewSystemError(statusCode int, message, userMessage string) error {
	if userMessage == "" {
		userMessage = "internal server error"
	}
	if message == "" {
		message = userMessage
	}
	return &SystemError{message, userMessage, statusCode}
}

func NewInternalError(err error) error {
	return &SystemError{err.Error(), "internal server error", http.StatusInternalServerError}
}
