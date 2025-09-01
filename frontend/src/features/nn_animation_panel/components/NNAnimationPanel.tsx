import type { Layer } from "../types";

import { useState } from "react";
import Neuron from "./Neuron";

interface NNAnimationPanelProps {
    width: number;
    network: Layer[];
    boardState: string[];
}

export default function NNAnimationPanel({ width, network, boardState }: NNAnimationPanelProps) {
    const offsetClosed: number = -33;
    const offsetOpen: number = 0;

    const [offset, setOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(offsetClosed);
    return (
        <div id="animation-panel" style={
            {
                width: `${width}vw`,
                height: "40vw",
                padding: "2vw",
                bottom: `${offset}vw`,
            }} className={`absolute transition-all bg-slate-500 rounded-t-2xl shadow-2xl z-10`}
            onClick={() => offset === offsetOpen ? setOffset(offsetClosed) : setOffset(offsetOpen)}>
            <svg width="89.25vw" height="36vw">
                {
                    network.map((layer, i) => {
                        return Array.from({ length: layer.size }).map((_, j) => {
                            return (
                                <Neuron key={`layer-${i}-${j}`} layerIndex={i} neuronIndex={j} networkLength={network.length}/>
                            )
                        })
                    })
                }
            </svg>
        </div>
    )
}
