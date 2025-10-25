package main

import (
	"fmt"
	"io"
	"log/slog"
	"os"
	"strconv"
	"strings"

	"t-cubed/internal/server"
)

const (
	MSG_USAGE = "Usage: server --port <port>"
)

func main() {
	// Get port from system arguments
	if len(os.Args) != 3 || strings.ToLower(os.Args[1]) != "--port" {
		fmt.Fprintln(os.Stderr, MSG_USAGE)
		os.Exit(1)
	}

	port, err := strconv.Atoi(os.Args[2])
	if err != nil || port < 1024 || port > 65535 {
		fmt.Fprintln(os.Stderr, MSG_USAGE)
		os.Exit(1)
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
