import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import type { Game, MoveRecord } from "../../../shared/types";

const buttonBaseStyles = [
    "w-full h-10 flex justify-center items-center",
    "transition-all duration-200 ease-in-out",
    "border-slate-400/50",
].join(" ")

const buttonSelectedStyles = [
    "bg-slate-300/50",
    "text-slate-50",
    "text-shadow-slate-900/40 text-shadow-md",
    "cursor-not-allowed",
].join(" ")

const buttonEnabledStyles = [
    "bg-slate-500",
    "hover:bg-slate-400 active:bg-slate-300",
    "text-slate-200",
    "hover:text-slate-700 active:text-slate-700",
].join(" ")

const buttonDisabledStyles = [
    "bg-slate-600",
    "text-slate-700/70",
    "cursor-not-allowed"
].join(" ")

const buttonAIEnabledStyles = [
    "bg-gradient-to-br from-amber-500/40 to-amber-200/60",
    "text-white",
    "hover:from-amber-400/50 hover:to-amber-100/70 active:from-amber-500/60 active:to-amber-200/80",
    "ring-2 ring-amber-400",
    "shadow-[0_0_14px_rgba(217,70,239,0.35)]",
    "motion-safe:animate-pulse"
].join(" ")

const buttonAISelectedStyles = [
    "bg-gradient-to-br from-amber-400/80 to-amber-100/90",
    "ring-2 ring-amber-400",
    "text-slate-50",
    "text-shadow-slate-900/40 text-shadow-md",
    "shadow-inner shadow-fuchsia-500/20",
    "cursor-not-allowed"
].join(" ")

interface MoveHistoryControlsProps {
    game: Game | null
    onMoveSelected: (moveRecord: MoveRecord) => void
}

// Removes the first move because it will always be empty
function removeFirstMove(moveHistory: MoveRecord[]): MoveRecord[] {
    return moveHistory.slice(1);
}

async function getMoveHistory(gameUuid: string): Promise<MoveRecord[] | undefined> {
    const res = await fetch(`/api/v1/game/${gameUuid}/history`)
    if (!res.ok) {
        throw new Error('Failed to fetch move history')
    }
    const data = await res.json()
    return removeFirstMove(data)
}

export default function MoveHistoryControls({ game, onMoveSelected }: MoveHistoryControlsProps) {
    if (!game || game.uuid.length === 0) return null;

    const [error, setError] = useState<string | null>(null);
    const [moveHistory, setMoveHistory] = useState<MoveRecord[] | null>(null);
    const [currentMoveIndex, setCurrentMoveIndex] = useState<number>(0);
    const [processing, setProcessing] = useState<boolean>(false);

    const handleMoveSelected = (moveIndex: number, moveHistory: MoveRecord[]): void => {
        if (moveIndex < 0 || moveIndex >= moveHistory.length) {
            return
        }
        setCurrentMoveIndex(moveIndex);
        setProcessing(true);
        onMoveSelected(moveHistory[moveIndex]);
        setTimeout(() => setProcessing(false), 100);
    }

    useEffect(() => {
        const fetchMoveHistory = async () => {
            const moveHistory = await getMoveHistory(game.uuid);
            if (!moveHistory) {
                setError("Failed to fetch move history");
                return;
            }
            setMoveHistory(moveHistory);
            setCurrentMoveIndex(moveHistory.length - 1);
        }
        fetchMoveHistory();
    }, [game.uuid]);

    if (error) {
        console.error(error);
        return null
    }
    if (!moveHistory) {
        return null
    }
    return (
        <motion.div
            animate={{ scale: [0, 1], opacity: [0, 1] }}
            className="relative w-82 md:w-102 mb-2 rounded-full overflow-clip"
        >
            {processing ? <div className="absolute top-0 z-50 w-full h-full bg-transparent" /> : null}
            <div className="w-full flex flex-row justify-between">
                <button
                    name="go-to-previous-move"
                    className={`${buttonBaseStyles} ${currentMoveIndex === 0 ? buttonDisabledStyles : buttonEnabledStyles} border-r-1`}
                    disabled={currentMoveIndex === 0}
                    onClick={() => handleMoveSelected(currentMoveIndex - 1, moveHistory)}
                >
                    <ChevronLeft />
                </button>
                {
                    moveHistory.map((mr, i) => (
                        <MoveButton
                            key={`move-button-${i}`}
                            index={i}
                            hasTrace={!!mr.trace}
                            selected={i === currentMoveIndex}
                            onClick={() => handleMoveSelected(i, moveHistory)}
                        />
                    ))
                }
                <button
                    name="go-to-next-move"
                    className={`${buttonBaseStyles} ${currentMoveIndex === moveHistory.length - 1 ? buttonDisabledStyles : buttonEnabledStyles} border-l-1`}
                    disabled={currentMoveIndex === moveHistory.length - 1}
                    onClick={() => handleMoveSelected(currentMoveIndex + 1, moveHistory)}
                >
                    <ChevronRight />
                </button>
            </div>
        </motion.div>
    )
}

interface MoveButtonProps {
    index: number;
    hasTrace?: boolean;
    selected?: boolean;
    onClick: () => void;
}

function MoveButton({ index, hasTrace = false, selected, onClick }: MoveButtonProps) {
    const classes = `${buttonBaseStyles} ${
        selected
            ? (hasTrace ? buttonAISelectedStyles : buttonSelectedStyles)
            : (hasTrace ? buttonAIEnabledStyles : buttonEnabledStyles)
    } ${hasTrace ? "border-0" : "border-l-1 border-r-1"}`;

    return (
        <button
            className={classes}
            disabled={selected}
            onClick={onClick}
            title={hasTrace ? "AI move" : "Human move"}
        >
            <span>{index + 1}</span>
        </button>
    )
}
