#!/bin/bash

# This script is used to watch for changes in .go files and automatically run the specified main.go file.
# Example: ./watch.sh ./cmd/server/main.go

if [ -z "$1" ]; then
  echo "Usage: $0 <path-to-main.go>"
  exit 1
fi

MAIN_FILE="$1"
DEBOUNCE=0.2

# Check if entr is installed
if ! command -v entr &>/dev/null; then
  echo "Error: 'entr' is not installed. Install with 'brew install entr' or 'sudo apt install entr'"
  exit 1
fi

# Find all .go files and pipe them to entr with a debounce of 200ms
echo "Watching .go files and running $MAIN_FILE on changes..."
find . -name '*.go' | entr -r sh -c "
    sleep $DEBOUNCE
    clear
    echo \"[RESTARTED] $(date +'%T')\"
    rm -rf tmp/bin
    mkdir -p tmp/bin
    go build -o ./tmp/bin/main $MAIN_FILE
    ./tmp/bin/main
"
