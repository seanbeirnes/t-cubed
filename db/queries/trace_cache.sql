-- name: GetTraceCache :one
SELECT * FROM trace_cache
WHERE uuid = $1;

-- name: GetTraceCacheByHash :one
SELECT * FROM trace_cache
WHERE pre_post_move_state_hash = $1;

-- name: CreateTraceCache :one
INSERT INTO trace_cache (uuid, pre_post_move_state_hash, trace)
VALUES (uuid_generate_v4(), $1, $2)
RETURNING *;
