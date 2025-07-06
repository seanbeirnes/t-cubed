package engine

type Game struct {
	Player1 *Player
	Player2 *Player
	CurrentPlayer *Player
	AI *AI
}

func NewGame(player1 *Player, player2 *Player, currentPlayer *Player) *Game {
	game := &Game{
		Player1: player1,
		Player2: player2,
		CurrentPlayer: currentPlayer,
	}
	return game
}

func (g *Game) NextTurn() {
	if g.CurrentPlayer == g.Player1 {
		g.CurrentPlayer = g.Player2
	} else {
		g.CurrentPlayer = g.Player1
	}
}
