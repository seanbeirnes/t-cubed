# Quick Start

## Prerequisites

- [Go](https://go.dev/doc/install)
- [PostgreSQL](https://www.postgresql.org/download/) or compatible serverless version
- [Docker](https://docs.docker.com/get-docker/)

## Installation

1. Clone the repository

```bash
git clone https://github.com/seanbeirnes/t-cubed.git
```

2. Install the dependencies

```bash
make setup
```

3. Update the .env files with secrets and details.

4. Run the database migrations

```bash
goose -env .env.db up
```

5. Build
```bash
make build
```

## Running separate services
The server and frontend can be run separately and automatically rebuilt when changes are made.
This is done with a watch script for the Go server and Vite for the frontend.

### Building the server
Use `make watch` to automatically rebuild the server when changes are made.
The API will be available at `http://localhost:8080/api/v1`.

### Building the frontend
Use `cd frontend && npm run dev` to start the Vite development server and watch for changes.
