package main

import (
	"io"
	"log/slog"
	"os"
	"strconv"

	"t-cubed/internal/server"
)

const defaultPort = 8080

func main() {
	port := defaultPort
	if value, ok := os.LookupEnv("PORT"); ok {
		parsedPort, err := strconv.Atoi(value)
		if err != nil || !isValidPort(parsedPort) {
			slog.Error("Invalid PORT", "value", value)
			os.Exit(1)
		}
		port = parsedPort
	}

	// Set up logging
	os.Mkdir("logs", 0700)

	logfile, err := os.OpenFile("logs/server.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0600)
	if err != nil {
		slog.Error("Could not open log file", "error", err)
		return
	}

	mw := io.MultiWriter(os.Stdout, logfile)
	logHandler := slog.NewJSONHandler(mw, nil)
	logger := slog.New(logHandler)
	slog.SetDefault(logger)

	server.RunServer(port)
}

func isValidPort(port int) bool {
	// A well-known port not used for HTTP/HTTPS was passed
	if port < 1024 && port != 80 && port != 443 {
		return false
	}
	// Outside valid range
	if port > 65535 {
		return false
	}
	return true
}
