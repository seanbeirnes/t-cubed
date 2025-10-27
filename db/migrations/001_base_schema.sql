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
    player_1_piece CHAR(1) NOT NULL,
    player_2_piece CHAR(1) NOT NULL,
    ai_player_id SMALLINT NOT NULL DEFAULT 0,
    terminal_state SMALLINT NOT NULL DEFAULT 0
);

CREATE TABLE trace_cache (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    -- The hash should be SHA256. This table will be invalidated if the hash algorithm changes.
    -- The hash of the pre-move and post-move states combined. Pre-move is the previous event's post move state.
    pre_post_move_state_hash BYTEA NOT NULL,
    trace BYTEA NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (pre_post_move_state_hash)
);

CREATE TABLE move_event (
    uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_uuid UUID NOT NULL REFERENCES game(uuid),
    trace_uuid UUID REFERENCES trace_cache(uuid),
    move_sequence SMALLINT NOT NULL DEFAULT 0,
    player_id SMALLINT NOT NULL CHECK (player_id=1 OR player_id=2),
    -- First 16 bits are for player 1, next 16 bits for player 2. 
    post_move_state BYTEA CHECK (octet_length(post_move_state)=4) DEFAULT '\000\000\000\000',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (game_uuid, move_sequence)
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
    BEFORE UPDATE ON game 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_game_type_updated_at
    BEFORE UPDATE ON game_type
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_trace_cache_updated_at 
    BEFORE UPDATE ON trace_cache 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_move_event_updated_at 
    BEFORE UPDATE ON move_event 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();



-- +goose Down
DROP TRIGGER IF EXISTS update_move_event_updated_at ON move_event;
DROP TRIGGER IF EXISTS update_trace_cache_updated_at ON trace_cache;
DROP TRIGGER IF EXISTS update_game_updated_at ON game;
DROP TRIGGER IF EXISTS update_game_type_updated_at ON game_type;
DROP FUNCTION IF EXISTS update_updated_at_column();

DROP TABLE IF EXISTS move_event;
DROP TABLE IF EXISTS trace_cache;
DROP TABLE IF EXISTS game;
DROP TABLE IF EXISTS game_type;

DROP SEQUENCE game_type_id_seq;

DROP EXTENSION IF EXISTS "uuid-ossp";
