import type { Layer, LayerType, NeuronFill } from "../types";
import { LAYER_TYPES, NEURON_FILLS } from "../types";

import { motion } from "motion/react";
import { useContext, useState, type Dispatch } from "react";
import Neuron from "./Neuron";
import Connection from "./Connection";
import { AppStateContext, AppStateDispatchContext } from "../../../App";
import type { AppState, AppStateAction } from "../../../shared/types";
import TransitionMask from "./TransitionMask";

const PADDING: number = 2;
const INNER_PADDING: number = 1;
const NEURON_WIDTH: number = 2;
const LAYER_MARGIN: number = 6;
const WINDOW_WIDTH_THRESHOLD: number = 600;

interface NNAnimationPanelProps {
    width: number;
    network: Layer[];
    boardState: string[];
}

export type Config = {
    padding: number;
    innerPadding: number;
    neuronWidth: number;
    neuronSpacing: number;
    totalLayers: number;
    layerSpacing: number;
    width: number;
    height: number;
    innerWidth: number;
    innerHeight: number;
}

function getConfig(width: number, network: Layer[]): Config {
    const height: number = (NEURON_WIDTH + LAYER_MARGIN) * network.length;
    const innerHeight: number = height - (PADDING * 2);
    const innerWidth: number = width - (PADDING * 2);

    const maxNeurons: number = getMaxNeuronsInLayer(network);
    const neuronSpacing: number = getNeuronSpacing(NEURON_WIDTH, maxNeurons, innerWidth, INNER_PADDING);

    const totalLayers: number = network.length;
    const layerSpacing: number = LAYER_MARGIN;

    return {
        padding: PADDING,
        innerPadding: INNER_PADDING,
        neuronWidth: NEURON_WIDTH,
        neuronSpacing: neuronSpacing,
        totalLayers: totalLayers,
        layerSpacing: layerSpacing,
        width: width,
        height: height,
        innerWidth: innerWidth,
        innerHeight: innerHeight,
    }
}

function getMaxNeuronsInLayer(network: Layer[]): number {
    return Math.max(...network.map(layer => layer.size));
}

function getNeuronSpacing(neuronWidth: number, neuronsInLayer: number, innerWidth: number, innerPadding: number): number {
    const totalNeuronsWidth: number = neuronsInLayer * neuronWidth;
    const spacing: number = innerWidth - totalNeuronsWidth - (innerPadding * 2);
    return spacing / (neuronsInLayer - 1);
}

function getLayerType(layerIndex: number, totalLayers: number): LayerType {
    switch (layerIndex) {
        case 0:
            return LAYER_TYPES.INPUT;
        case totalLayers - 1:
            return LAYER_TYPES.OUTPUT;
        default:
            return LAYER_TYPES.HIDDEN;
    }
}

function getNeuronX(neuronIndex: number, neuronsInLayer: number, config: Config): number {
    let layerWidth: number = (neuronsInLayer - 1) * (config.neuronWidth + config.neuronSpacing)
    layerWidth += config.neuronWidth;
    const startX: number = (config.innerWidth - layerWidth) / 2;
    const horizontalOffset = neuronIndex * (config.neuronWidth + config.neuronSpacing)
    return startX + horizontalOffset + config.innerPadding;
}

function getNeuronY(layerIndex: number, config: Config): number {
    const layerHeight: number = config.neuronWidth + config.layerSpacing;
    const verticalOffset: number = layerIndex * layerHeight;
    const y: number = verticalOffset + config.padding;
    return y;
}

function getNeruonFill(layerType: LayerType, neuronIndex: number): NeuronFill {
    if (layerType === LAYER_TYPES.INPUT && neuronIndex < 9) {
        return NEURON_FILLS.INPUT_PLAYER_1;
    } else if (layerType === LAYER_TYPES.INPUT && neuronIndex >= 9) {
        return NEURON_FILLS.INPUT_PLAYER_2;
    } else if (layerType === LAYER_TYPES.OUTPUT) {
        return NEURON_FILLS.OUTPUT;
    }
    return NEURON_FILLS.HIDDEN;
}

function getMotionDelay(layerIndex: number, neuronIndex: number): number {
    return (layerIndex + neuronIndex + 1) * 0.01;
}

function getLayerAltText(layerIndex: number, layerType: LayerType): string {
    if (layerType === LAYER_TYPES.INPUT) {
        return `Layer ${layerIndex + 1}, Input Layer`;
    } else if (layerType === LAYER_TYPES.HIDDEN) {
        return `Layer ${layerIndex + 1}, Hidden Layer`;
    } else if (layerType === LAYER_TYPES.OUTPUT) {
        return `Layer ${layerIndex + 1}, Output Layer`;
    }
    return "";
}

export default function NNAnimationPanel({ width, network, boardState }: NNAnimationPanelProps) {
    const appState: AppState = useContext(AppStateContext);

    const config: Config = getConfig(width, network);

    const offsetOpen: number = 0;
    const offsetClosed: number = -(config.totalLayers - 1) * (config.neuronWidth + config.layerSpacing);
    const [offset, setOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(offsetClosed);
    const [expanded, setExpanded] = useState(false);
    const [expandedCount, setExpandedCount] = useState(0);

    const showNeuronText: boolean = appState.window.width > WINDOW_WIDTH_THRESHOLD;

    const toggleExpanded = () => {
        offset === offsetOpen ? setOffset(offsetClosed) : setOffset(offsetOpen);
        setExpanded(!expanded);
        setExpandedCount(expandedCount + 1);
    };

    /*
     * Handles the click event on the panel. If the window is larger than the threshold, only toggle the panel if it is closed.
     * Otherwise, toggle the panel regardless of whether it is open or closed.
     * This is to allow the panel to be toggled by fingers on touch screens, but keep it from being toggled accidentally by mouse clicks.
     */
    function handlePanelClick() {
        if (appState.window.width > WINDOW_WIDTH_THRESHOLD) {
            if (!expanded) toggleExpanded();
        } else {
            toggleExpanded();
        }
    }

    return (
        <div id="nn-animation-panel" style={
            {
                width: `${config.width}vw`,
                height: `${config.height + 4}vw`,
                padding: `${config.padding}vw`,
                bottom: `${offset}vw`,
            }}
            className={`absolute transition-all bg-gradient-to-t from-slate-700 via-slate-500 to-slate-700 rounded-t-2xl shadow-2xl z-10`}
            aria-label="Neural network animation panel"
            onClick={handlePanelClick}
            aria-expanded={expanded}
            role="region"
        >
            <div className={`grid ${appState.window.width < WINDOW_WIDTH_THRESHOLD ? "grid-cols-2" : "grid-cols-4"} justify-items-center`}>
                <button
                    className={`${appState.window.width < WINDOW_WIDTH_THRESHOLD ? "hidden" : ""} justify-self-start text-white bg-slate-200 rounded-full w-32`}
                    style={{ fontSize: "2vw" }}
                    onClick={toggleExpanded}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            if (expanded) toggleExpanded();
                        }
                    }}
                    aria-controls="nn-animation-panel"
                    aria-label={expanded ? "Close neural network animation panel" : "Open neural network animation panel"}
                >
                    {expanded ? "V" : "^"}
                </button>
                <p className="text-green-400 font-bold outline-2 outline-slate-500 rounded-full text-center shadow-inner text-shadow-md text-shadow-green-900"
                    style={{
                        fontSize: "1.75vw",
                        width: "20vw",
                        padding: "0.25vw"
                    }}>Player 1 (Human)</p>
                <p className="text-blue-400 font-bold outline-2 outline-slate-500 rounded-full text-center shadow-inner text-shadow-md text-shadow-blue-900"
                    style={{
                        fontSize: "1.75vw",
                        width: "20vw",
                        padding: "0.25vw"
                    }}>Player 2 (AI)</p>
            </div>
            <svg aria-label="Neural network diagram" width={`${config.innerWidth}vw`} height={`${config.innerHeight}vw`}>
                {/* Render the connections between neurons first so they are behind the neurons */}
                {network.map((layer, i) => {
                    if (!expanded) return null;
                    if (i === network.length - 1) return null; // last layer has no outgoing connections

                    const nextLayer = network[i + 1];

                    return Array.from({ length: layer.size }).flatMap((_, j) => {
                        const x1 = getNeuronX(j, layer.size, config);
                        const y1 = getNeuronY(i, config) + config.neuronWidth / 2;

                        return Array.from({ length: nextLayer.size }).map((_, k) => {
                            const x2 = getNeuronX(k, nextLayer.size, config);
                            const y2 = getNeuronY(i + 1, config) - config.neuronWidth / 2;

                            const intensity =
                                (layer.activations ? layer.activations[j] : 0) *
                                (nextLayer.activations ? nextLayer.activations[k] : 0);

                            return (
                                <Connection
                                    key={`connection-${i}-${j}-${k}`}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    activation={intensity}
                                />
                            );
                        });
                    });
                })}

                <TransitionMask
                    key={`connections-mask-${offset}`}
                    config={config}
                    blocksPerRow={32}
                    shortenDuration={!expanded} // Duration is shorter when closing panel
                    hidden={expandedCount === 0}// Hide the mask when page is first loaded
                />

                {/* Render the neurons for each layer */}
                {
                    network.map((layer, i) => {
                        const layerType: LayerType = getLayerType(i, config.totalLayers);
                        return (
                            <g key={`layer-${i}`} role="treeitem" aria-label={getLayerAltText(i, layerType)}>
                                {
                                    Array.from({ length: layer.size }).map((_, j) => {
                                        const activation = layer.activations ? layer.activations[j] : 0;
                                        return (
                                            <Neuron
                                                key={`neuron-${i}-${j}`}
                                                x={getNeuronX(j, layer.size, config)}
                                                y={getNeuronY(i, config)}
                                                fill={getNeruonFill(layerType, j)}
                                                motionDelay={getMotionDelay(i, j)}
                                                activation={activation}
                                                showText={showNeuronText}
                                            />
                                        )
                                    })
                                }
                            </g>
                        )
                    })
                }
            </svg>
            <div className="flex flex-row justify-center">
                <p className="text-amber-400 font-bold rounded-b-lg text-center text-shadow-md text-shadow-amber-900"
                    style={{
                        fontSize: "1.5vw",
                        width: "40vw",
                    }}>
                    ^ Best Moves ^
                </p>
            </div>
        </div>
    )
}
