-- name: CreateMoveEvent :one
INSERT INTO move_event (uuid, game_uuid, trace_uuid, move_sequence, player_id, post_move_state)
VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
RETURNING *;

-- name: ListGameMoveEvents :many
SELECT * FROM move_event
WHERE game_uuid = $1;

-- name: ListGameMoveEventsWithTrace :many
SELECT * FROM move_event
JOIN trace_cache ON trace_cache.uuid = move_event.trace_uuid
WHERE move_event.game_uuid = $1
ORDER BY move_event.move_sequence;
