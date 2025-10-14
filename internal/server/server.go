package server

import (
	"os"
	"log/slog"
	"context"
	"time"
	"syscall"
	"os/signal"
	"net/http"
)


func RunServer() {
	config := newConfig()
	defer config.Cleanup()

	router := newRouter(config)
	srv := &http.Server{
		Addr:    ":" + config.PORT,
		Handler: router,
	}

	// Start server in separate goroutine and monitor for graceful shutdown
	go func() {
		slog.Info("Starting server...")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("listen: %s\n", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("Shutting down server...")

	// The context is used to inform the server it has 5 seconds to finish its current request
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		slog.Warn("Forced shutdown", "error", err)
	}

	slog.Info("Server exiting...")
}
