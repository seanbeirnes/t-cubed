# AGENTS.md
t-cubed Agent Guide

## Setup commands
- `make setup` installs `entr`, `goose`, `sqlc` and downloads modules.
- Backend dev: `make watch` (needs `entr`) or `go run ./cmd/server`.
- Tests: `make test` or `go test -v ./...`.
- Single test: `go test ./internal/... -run '^TestName$' -v`.
- Static checks: `go vet ./...`; format: `go fmt ./...` (use goimports grouping).
- Frontend dev: `cd frontend && npm run dev`; build: `npm run build`; lint: `npm run lint`.

## Code Style
- Go naming: exported PascalCase; unexported lowerCamelCase; interfaces end with -er.
- Errors: return `error`; no panics in libs; wrap `fmt.Errorf("context: %w", err)`; `var ErrX = errors.New(...)`.
- Logs: use `slog.Info` and `slog.Error` for info and error logs.
- Imports: group std/third-party/internal; alias protobufs as `pb`.
- Context: accept `context.Context` first for I/O/DB/service boundaries.
- Types/tests: prefer concrete types; small funcs; table-driven tests; benchmarks `go test -bench .`.
- TS/React: components PascalCase; hooks `use*`; `.tsx` for JSX; prefer named exports.
- TS types/imports: avoid `any`; use unions; order node/third-party/local.
- Formatting: Go via `go fmt`; TS via ESLint/TS; commit lint-clean code.

## Database
- SQL: use `sqlc` to generate models and queries.
- Migrations: use `goose` to generate migrations.
