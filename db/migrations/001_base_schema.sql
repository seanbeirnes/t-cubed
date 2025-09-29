-- +goose Up
CREATE TYPE piece_type AS ENUM ('_', 'X', 'O');
CREATE SEQUENCE game_type_id_seq;

CREATE TABLE game_type (
    id INT PRIMARY KEY DEFAULT nextval('game_type_id_seq'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    label VARCHAR(255) NOT NULL
);

CREATE TABLE game (
    uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    game_type_id INT NOT NULL REFERENCES game_type(id),
    -- First 16 bits are for player 1, next 16 bits for player 2. 
    board_state BYTEA CHECK (octet_length(board_state)=4) DEFAULT '\000\000\000\000',
    next_player_id SMALLINT NOT NULL CHECK (next_player_id=1 OR next_player_id=2),
    player_1_piece piece_type NOT NULL,
    player_2_piece piece_type NOT NULL
);

INSERT INTO game_type (label) 
VALUES 
    ('neural_network'), 
    ('minimax'),
    ('humans');

-- +goose StatementBegin
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at := NOW();
   RETURN NEW;
END;
$$
LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER update_game_updated_at 
    BEFORE UPDATE ON game FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_game_type_updated_at
BEFORE UPDATE ON game_type
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();

-- +goose Down
DROP TRIGGER IF EXISTS update_game_updated_at ON game;
DROP TRIGGER IF EXISTS update_game_type_updated_at ON game_type;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE game;
DROP TABLE game_type;

DROP SEQUENCE game_type_id_seq;
DROP TYPE piece_type;
