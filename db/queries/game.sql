-- name: GetGameByUUID :one
SELECT * FROM game 
WHERE uuid = $1;

-- name: CreateGame :one
INSERT INTO game (uuid, name, game_type_id, first_move_player_id, ai_player_id, player_1_piece, player_2_piece)
VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6)
RETURNING *;

-- name: UpdateGame :one
UPDATE game
SET name = $1, terminal_state = $2
WHERE uuid = $3
RETURNING *;

-- name: DeleteGame :exec
DELETE FROM game
WHERE uuid = $1;
