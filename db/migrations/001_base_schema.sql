-- +goose Up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE SEQUENCE game_type_id_seq;

CREATE TABLE game_type (
    id INT PRIMARY KEY DEFAULT nextval('game_type_id_seq'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    label VARCHAR(255) NOT NULL
);

CREATE TABLE game (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    name VARCHAR(255) NOT NULL,
    game_type_id INT NOT NULL REFERENCES game_type(id),
    -- First 16 bits are for player 1, next 16 bits for player 2. 
    board_state BYTEA CHECK (octet_length(board_state)=4) DEFAULT '\000\000\000\000',
    next_player_id SMALLINT NOT NULL CHECK (next_player_id=1 OR next_player_id=2),
    player_1_piece CHAR(1) NOT NULL,
    player_2_piece CHAR(1) NOT NULL,
    ai_player_id SMALLINT NOT NULL DEFAULT 0,
    terminal_state SMALLINT NOT NULL DEFAULT 0
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

DROP EXTENSION IF EXISTS "uuid-ossp";
