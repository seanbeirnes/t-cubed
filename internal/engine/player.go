package engine

import (
	"t-cubed/internal/util"
)

type Player struct {
	Id         uint8
	Piece      uint8
}

func newPlayer(id uint8, piece byte) *Player {
	util.Assert(id > 0 && id < 3, "Invalid player ID")
	util.Assert(piece == PIECE_X || piece == PIECE_O, "Invalid piece")

	player := &Player{
		Id:         id,
		Piece:      piece,
	}

	return player
}
