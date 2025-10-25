# Frontend build
FROM node:25-alpine3.22 AS frontend
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Backend build
FROM golang:1.25.3-alpine3.22 AS backend
WORKDIR /app/server

COPY go.mod go.sum ./
RUN go mod download

COPY cmd/server  cmd/server
COPY internal internal/
RUN go build -o server ./cmd/server

# Final image
FROM alpine:3.22

RUN addgroup -S appuser && adduser -S -G appuser appuser

WORKDIR /app

COPY --from=frontend /app/frontend/dist static/
COPY --from=backend /app/server/server ./
COPY data/ data/

RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

CMD ["./server", "--port", "8080"]
