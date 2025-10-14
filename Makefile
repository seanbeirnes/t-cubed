.PHONY: setup
setup:
	./script/setup.sh

.PHONY: watch
watch:
	./script/watch.sh ./cmd/server/main.go

.PHONY: test
test:
	go test -v ./...

.PHONY: clean
clean:
	@echo "Are you sure you want to delete /tmp?"
	@echo "Press any key to continue or Ctrl-C to cancel."
	@read && rm -rf ./tmp && echo "project cleanned"
