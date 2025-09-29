# Quick Start

## Prerequisites

- [Go](https://go.dev/doc/install)
- [PostgreSQL](https://www.postgresql.org/download/) or compatible serverless version
- [Docker](https://docs.docker.com/get-docker/)
- [Goose](https://github.com/pressly/goose)

## Installation

1. Clone the repository

```bash
git clone https://github.com/seanbeirnes/t-cubed.git
```

1. Install the dependencies

```bash
go mod download
```

1. Create .env files based on the examples in the `doc` directory.

1. Run the database migrations

```bash
goose -env .env.db up
```
