package main

import (
	"io"
	"log/slog"
	"os"

	"t-cubed/internal/server"
)

func main() {
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

	server.RunServer()
}
