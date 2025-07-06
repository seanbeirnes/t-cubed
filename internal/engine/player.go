package engine

const (
	PIECE_X = 'X'
	PIECE_O = '0'
)

type Player struct {
	Id         uint8
	Board      uint16
	Piece      uint8
}

func NewPlayer(id uint8, piece byte, isComputer bool) *Player {
	player := &Player{
		Id:         id,
		Board:      0x0000,
		Piece:      piece,
	}

	return player
}

func (p *Player) MakeMove(position uint8) bool {
	if !p.HasMove(position) {
		return false
	}
    p.Board |= 1 << position
	return true
}

func (p *Player) HasMove(position uint8) bool {
    return p.Board & (1 << position) != 0
}

func (p *Player) ResetBoard() {
	p.Board = 0
}
