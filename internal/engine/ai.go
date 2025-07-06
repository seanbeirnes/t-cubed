package engine

const (
	MINIMAX_MODE = iota
	FFNN_MODE
)

type AIEngine interface {
	PlayTurn(game *Game) bool
}

type MinimaxAIEngine struct {
	Human *Player
	Computer *Player
}

type FFNNAIEngine struct {
	Human *Player
	Computer *Player
	Network *FFNN
}

type FFNN struct {
	Input []float32
	Output []float32
}

func NewAIEngine(Mode uint8, Human *Player, Computer *Player) AIEngine {
	if Mode == MINIMAX_MODE {
		return newMinimaxAIEngine(Human, Computer)
	}
	if Mode == FFNN_MODE {
		return newFFNNAIEngine(Human, Computer)
	}
	panic("Invalid AI Engine Mode")
}

func newMinimaxAIEngine(Human *Player, Computer *Player) *MinimaxAIEngine {
	engine := &MinimaxAIEngine{
		Human: Human,
		Computer: Computer,
	}
	return engine
}

func newFFNNAIEngine(Human *Player, Computer *Player) *FFNNAIEngine {
	engine := &FFNNAIEngine{
		Human: Human,
		Computer: Computer,
		Network: nil,
	}
	return engine
}

func (engine *MinimaxAIEngine) PlayTurn(game *Game) bool {
	// TODO: Implement Minimax AI
	return false
}

func (engine *FFNNAIEngine) PlayTurn(game *Game) bool {
	// TODO: Implement FFNN AI
	return false
}
