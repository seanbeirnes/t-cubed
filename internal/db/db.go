package db

import (
	"context"
	"errors"
	"log/slog"

	"github.com/jackc/pgx/v5"
)

type Database interface {
	Connect(databaseURL string) error
	Close() error
}

type PostgresDB struct {
	databaseURL string
	Connection  *pgx.Conn
}

func NewPostgresDB(databaseURL string) *PostgresDB {
	return &PostgresDB{
		databaseURL,
		nil,
	}
}

func (db *PostgresDB) Connect() error {
	var err error
	db.Connection, err = pgx.Connect(context.Background(), db.databaseURL)
	if err != nil {
		slog.Error("Could not connect to database", "error", err)
		return err
	}
	slog.Info("Database connection successful.")
	return nil
}

func (db *PostgresDB) Close() error {
	if db.Connection == nil {
		return errors.New("No connection to close")
	}

	err :=db.Connection.Close(context.Background())
	if err != nil {
		slog.Error("Could not close database connection", "error", err)
		return err
	}
	slog.Info("Database connection closed.")
	return nil
}
