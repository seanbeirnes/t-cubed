#!/bin/bash

# This script is used to setup the environment for the t-cubed project.
# Usage: ./script/setup.sh

echo "The following dependencies will be installed:"
echo "- entr: A file watcher for shell scripts"
echo "- sqlc: A compiler for SQLite"
echo "Press any key to continue or Ctrl+C to abort."
read
echo "Setting up environment..."

# Check if entr is installed
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

# Check if sqlc is installed
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

echo "Environment setup complete!"
