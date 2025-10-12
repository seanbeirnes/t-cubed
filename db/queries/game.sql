-- name: GetGameByUUID :one
SELECT * FROM game 
WHERE uuid = $1;

-- name: CreateGame :one
INSERT INTO game (uuid, name, game_type_id, next_player_id, ai_player_id, player_1_piece, player_2_piece)
VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateGame :one
UPDATE game
SET name = $1, next_player_id = $2, board_state = $3, terminal_state = $4
WHERE uuid = $5
RETURNING *;

-- name: DeleteGame :exec
DELETE FROM game
WHERE uuid = $1;
