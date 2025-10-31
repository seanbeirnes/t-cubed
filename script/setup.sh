#!/bin/bash

# This script is used to setup the environment for the t-cubed project.
# Usage: ./script/setup.sh

if ! command -v go &>/dev/null; then
  echo "Go is not installed. Please install Go: https://go.dev/doc/install"
  exit 1
fi

echo "Welcome to the t-cubed setup script!"
echo "The following dependencies will be installed:"
echo "- entr: A file watcher for shell scripts"
echo "- goose: A database migration tool for SQL databases"
echo "- sqlc: A compiler for SQLite"
echo "Press any key to continue or Ctrl+C to abort."
read
echo "Setting up environment..."

echo "Checking for entr..."
if ! command -v entr &>/dev/null; then
  echo "'entr' not found. Installing..."
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install entr
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    sudo apt install -y entr
  else
    echo "Please install 'entr' manually: https://github.com/eradman/entr"
    exit 1
  fi
fi

echo "Checking for goose..."
if ! command -v goose &>/dev/null; then
    echo "'goose' not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install goose
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt install -y goose
    else
        echo "Please install 'goose' manually: https://github.com/pressly/goose"
        exit 1
    fi
fi

echo "Checking for sqlc..."
if ! command -v sqlc &>/dev/null; then
    echo "'sqlc' not found. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install sqlc
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt install -y sqlc
    else
        echo "Please install 'sqlc' manually: https://github.com/sqlc-dev/sqlc"
        exit 1
    fi
fi

echo "Checking for .env files..."
if [ ! -f .env ]; then
  echo "Creating .env file..."
  cp doc/.example.env .env
fi
if [ ! -f .env.db ]; then
  echo "Creating .env.db file..."
  cp doc/.example.env.db .env.db
fi

echo "Installing go dependencies..."
go mod download

echo "Environment setup complete!"
