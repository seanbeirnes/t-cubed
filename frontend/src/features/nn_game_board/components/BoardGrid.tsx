import { useCallback, useContext } from "react";

import type { GameToken } from "../../../shared/types";
import Cell from "./Cell";

import { NNHoverStateContext} from "../../nn_game_controller";

interface BoardGridProps {
    boardState: GameToken[];
    winningLine: number[] | null;
    playMove: (position: number) => void;
    humanToken: GameToken;
}

export function BoardGrid({ boardState, winningLine, playMove, humanToken }: BoardGridProps) {
    const hoverState = useContext(NNHoverStateContext);
    const onCellHover = (cell: number | null) => {
        if (cell !== null && (cell < 0 || cell > 8)) {
            console.warn("Invalid cell index");
            return;
        }
        if (hoverState.setHoveredCell === null) return;

        hoverState.setHoveredCell(cell);
    };

    const handleCellHover = useCallback(onCellHover, [hoverState.hoveredCell])

    // Determines if the mouse is hovering over the cell or the corresponding neuron
    const isEmphasized = (index: number) => {
        const hoveredCell = hoverState.hoveredCell;
        const hoveredNeuron = hoverState.hoveredNeuron;

        const isHoveredCell = hoveredCell !== null && hoveredCell === index;

        // We only are concerned with input and output layer neurons
        const isInputorOutputLayer = hoveredNeuron !== null && (hoveredNeuron.layerIndex === 0 || hoveredNeuron.layerIndex === 4);

        // If the user is hovering over a corresponding neuron, highlight this cell
        const hasHoveredNeuron = isInputorOutputLayer && hoveredNeuron.neuronIndex  % 9 === index;

        return isHoveredCell || hasHoveredNeuron;
    }

    return (
        <div className="grid grid-cols-3 grid-rows-3 gap-0">
            {boardState.map((token, idx) => (
                <Cell
                    key={`cell-${idx}`}
                    index={idx}
                    token={token}
                    isWinning={!!winningLine?.includes(idx)}
                    emphasized={isEmphasized(idx)}
                    onHover={handleCellHover}
                    onClick={() => playMove(idx + 1)}
                    moveRank={2}
                    humanToken={humanToken}
                />
            ))}
        </div>
    );
}

export default BoardGrid;
