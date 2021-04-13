package main

// HTTPError passes the error message and HTTP status code returned by the error
// to the rest of the application.
type HTTPError struct {
	Message    string
	StatusCode int
}

func (e *HTTPError) Error() string {
	return e.Message
}

func httpError(statusCode int, message string) error {
	return &HTTPError{message, statusCode}
}
