-- name: GetGameByUUID :one
SELECT sqlc.embed(g), sqlc.embed(me)
FROM game g
LEFT JOIN move_event me
  ON me.uuid = (
      SELECT uuid
      FROM move_event
      WHERE game_uuid = g.uuid
      ORDER BY move_sequence DESC
      LIMIT 1
  )
WHERE g.uuid = $1;

-- name: CreateGame :one
INSERT INTO game (uuid, name, game_type_id, ai_player_id, player_1_piece, player_2_piece)
VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateGame :one
UPDATE game
SET name = $1, terminal_state = $2
WHERE uuid = $3
RETURNING *;

-- name: DeleteGame :exec
DELETE FROM game
WHERE uuid = $1;
