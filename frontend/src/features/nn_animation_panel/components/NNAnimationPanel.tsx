import { useContext, useRef, useState } from "react";

import type { Layer, LayerType, NeuronFill, OverrideExpandedState } from "../types";
import type { HoveredNeuron } from "../../nn_game_controller";
import type { AppState, WeightsLayer } from "../../../shared/types";
import { LAYER_TYPES, NEURON_FILLS, OVERRIDE_EXPANDED_STATE } from "../types";

import { ChevronsUpDown, ChevronsDownUp, ArrowUp, ArrowDown } from "lucide-react";

import { AppStateContext } from "../../../App";
import { NNHoverStateContext } from "../../nn_game_controller";
import Neuron from "./Neuron";
import Connection from "./Connection";
import NeuronMathOverlay, { type OverlayData, type OverlayTerm } from "./NeuronMathOverlay";

const PADDING: number = 2;
const INNER_PADDING: number = 1;
const NEURON_WIDTH: number = 2;
const LAYER_MARGIN: number = 6;
const WINDOW_WIDTH_THRESHOLD: number = 768;

interface NNAnimationPanelProps {
    width: number;
    weights: WeightsLayer[];
    network: Layer[];
    overrideExpandedState?: OverrideExpandedState;
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

function isHoveredNeuronInOutputLayer(hoveredNeuron: HoveredNeuron | null, config: Config): boolean {
    return hoveredNeuron !== null && hoveredNeuron.layerIndex === config.totalLayers - 1;
}

function isHoveredNeuronInInputLayerPlayer1(hoveredNeuron: HoveredNeuron | null): boolean {
    return hoveredNeuron !== null && hoveredNeuron.layerIndex === 0 && hoveredNeuron.neuronIndex < 9;
}

function isHoveredNeuronInInputLayerPlayer2(hoveredNeuron: HoveredNeuron | null): boolean {
    return hoveredNeuron !== null && hoveredNeuron.layerIndex === 0 && hoveredNeuron.neuronIndex >= 9;
}

// Get the largest activation value in the layer to help normalize the opacity/colors of the neurons
function getLayerActivationMax(layer: Layer): number {
    if (!layer.activations) return 0;
    return Math.max(...layer.activations);
}

export default function NNAnimationPanel({ width, weights, network, overrideExpandedState = OVERRIDE_EXPANDED_STATE.NONE }: NNAnimationPanelProps) {
    const appState: AppState = useContext(AppStateContext);
    const hoverState = useContext(NNHoverStateContext);
    const showNeuronText: boolean = appState.window.width > WINDOW_WIDTH_THRESHOLD;

    const config: Config = getConfig(width, network);

    const offsetOpen: number = 0;
    const offsetClosed: number = -(config.totalLayers - 1) * (config.neuronWidth + config.layerSpacing);
    const [offset, setOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(offsetClosed);
    const [expanded, setExpanded] = useState(false);
    const panelRef = useRef<HTMLDivElement | null>(null);
    const [overlayVisible, setOverlayVisible] = useState(false);
    const [overlayAnchor, setOverlayAnchor] = useState<{ x: number; y: number } | null>(null);
    const [overlayData, setOverlayData] = useState<OverlayData | null>(null);
    const fadeTimerRef = useRef<number | null>(null);
    const [expandedCount, setExpandedCount] = useState(0);

    const handleNeuronHover = (hoveredNeuron: HoveredNeuron | null) => {
        if (appState.window.width < WINDOW_WIDTH_THRESHOLD) return; // don't show hover state on mobile
        if (hoverState.setHoveredNeuron === null) return;
        hoverState.setHoveredNeuron(hoveredNeuron);

        // Floating math overlay
        if (hoveredNeuron && expanded) {
            const { layerIndex, neuronIndex } = hoveredNeuron;
            // Skip input layer
            if (layerIndex === 0) {
                setOverlayVisible(false);
                setOverlayData(null);
                return;
            }

            const prevLayer: Layer = network[layerIndex - 1];
            const currLayer: Layer = network[layerIndex];
            const wLayer: WeightsLayer = weights[layerIndex - 1];
            const hasData = prevLayer?.activations && currLayer?.activations && wLayer;
            if (!hasData) {
                setOverlayData(null);
                setOverlayVisible(true); // show friendly message
            } else {
                const aPrev: number[] = prevLayer.activations ?? [];
                const bias: number = wLayer.biases[neuronIndex] ?? 0;
                // weights matrix is input x output: weights[i][j]
                let z = bias;
                const terms: OverlayTerm[] = [];
                for (let i = 0; i < Math.min(aPrev.length, wLayer.weights.length); i++) {
                    const w = wLayer.weights[i]?.[neuronIndex] ?? 0;
                    const x = aPrev[i] ?? 0;
                    const product = w * x;
                    z += product;
                    terms.push({ index: i, weight: w, input: x, product });
                }
                const isOutput = layerIndex === config.totalLayers - 1;
                const activationName = isOutput ? "identity" : "ReLU";
                const a = isOutput ? z : (z > 0 ? z : 0);
                const topTerms = terms
                    .slice()
                    .sort((a, b) => Math.abs(b.product) - Math.abs(a.product))
                    .slice(0, 8);
                setOverlayData({ layerIndex, neuronIndex, bias, z, a, activationName, terms, topTerms });
                setOverlayVisible(true);
            }

            // Position near neuron
            const layer = network[layerIndex];
            const neuronX = getNeuronX(neuronIndex, layer.size, config) * appState.window.vw;
            const neuronY = getNeuronY(layerIndex, config) * appState.window.vw;
            const rect = panelRef.current?.getBoundingClientRect();
            // Anchor uses viewport coords for overlay flipping logic
            const left = (rect?.left ?? 0) + neuronX + (2 * appState.window.vw); // nudge to circle edge
            const top = (rect?.top ?? 0) + neuronY + (5 * appState.window.vw); // nudge to circle edge
            setOverlayAnchor({ x: left, y: top });

            // Cancel any pending fade-out
            if (fadeTimerRef.current) {
                window.clearTimeout(fadeTimerRef.current);
                fadeTimerRef.current = null;
            }
        } else {
            // start fade-out
            if (fadeTimerRef.current) window.clearTimeout(fadeTimerRef.current);
            fadeTimerRef.current = window.setTimeout(() => {
                setOverlayVisible(false);
                setOverlayData(null);
                setOverlayAnchor(null);
            }, 120);
        }
    };

    const toggleExpanded = () => {
        offset === offsetOpen ? setOffset(offsetClosed) : setOffset(offsetOpen);
        setExpanded(!expanded);
        setExpandedCount(expandedCount + 1);
    };

    // Determines whether a neuron should be highlighted
    const isEmphasized = (layerIndex: number, neuronIndex: number) => {
        // We only want to highlight input and output layer neurons
        if (layerIndex > 0 && layerIndex < config.totalLayers - 1) return false;

        // If the user is hovering a game board cell, highlight the corresponding neuron
        const hasHoveredCell = hoverState.hoveredCell !== null && neuronIndex % 9 === hoverState.hoveredCell;

        // If this is the currently hovered neuron, highlight it
        const isHoveredNeuron = hoverState.hoveredNeuron !== null && hoverState.hoveredNeuron.layerIndex === layerIndex && hoverState.hoveredNeuron.neuronIndex === neuronIndex;

        return hasHoveredCell || isHoveredNeuron;
    }

    /*
     * Handles the click event on the panel. If the window is larger than the threshold, users must click the button.
     * Otherwise, toggle the panel for smaller screens when the button is not rendered.
     * This is to allow the panel to be toggled by fingers on touch screens, but keep it from being toggled accidentally by mouse clicks.
     */
    function handlePanelClick() {
        if (appState.window.width > WINDOW_WIDTH_THRESHOLD) {
            return;
        } else {
            toggleExpanded();
        }
    }

    if (overrideExpandedState === OVERRIDE_EXPANDED_STATE.OPEN && offset === offsetClosed) {
        toggleExpanded();
    }
    if (overrideExpandedState === OVERRIDE_EXPANDED_STATE.CLOSED && offset === offsetOpen) {
        toggleExpanded();
    }

    return (
        <div ref={panelRef} id="nn-animation-panel" style={
            {
                width: `${config.width}vw`,
                height: `${config.height + 4}vw`,
                padding: `${config.padding}vw`,
                bottom: `${offset}vw`,
            }}
            className={`absolute transition-all bg-gradient-to-t from-slate-700 via-slate-500 to-slate-700 outline-2 outline-slate-500 rounded-t-2xl shadow-2xl z-100`}
            aria-label="Neural network animation panel"
            onClick={handlePanelClick}
            aria-expanded={expanded}
            role="region"
        >
            <div className={`grid grid-cols-2 md:grid-cols-8 justify-items-center gap-[2vw]`}>
                <button
                    className={`col-span-1 justify-self-start min-w-[2vw] px-6 py-1 outline-2 outline-amber-500 text-amber-500 bg-slate-500 transition-all duration-200 
                    ${appState.window.width < WINDOW_WIDTH_THRESHOLD ? "hidden" : ""} 
                    ${overrideExpandedState === OVERRIDE_EXPANDED_STATE.OPEN || overrideExpandedState === OVERRIDE_EXPANDED_STATE.CLOSED ? "opacity-50 cursor-not-allowed" : ""}
                    ${overrideExpandedState === OVERRIDE_EXPANDED_STATE.NONE ? "hover:text-amber-400 hover:outline-amber-400 hover:bg-slate-400 active:text-amber-600 active:bg-slate-600" : ""} 
                    shadow-inner rounded-full`}
                    onClick={toggleExpanded}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            if (expanded) toggleExpanded();
                        }
                    }}
                    aria-controls="nn-animation-panel"
                    aria-label={expanded ? "Close neural network animation panel" : "Open neural network animation panel"}
                    title={expanded ? "Close neural network animation panel" : "Open neural network animation panel"}
                    disabled={overrideExpandedState === OVERRIDE_EXPANDED_STATE.OPEN || overrideExpandedState === OVERRIDE_EXPANDED_STATE.CLOSED}
                >
                    {expanded ? <ChevronsDownUp className="w-full h-full" /> : <ChevronsUpDown className="w-full h-full" />}
                </button>
                <p className={`group ${isHoveredNeuronInInputLayerPlayer1(hoverState.hoveredNeuron) ? "is-hovered opacity-75" : ""} transition-opacity duration-200 col-span-1 md:col-span-3 justify-self-end flex justify-around items-center text-green-400 font-bold outline-2 outline-slate-500 rounded-full shadow-inner text-shadow-md text-shadow-green-900`}
                    style={{
                        fontSize: "1.75vw",
                        width: "24vw",
                        padding: "0.25vw"
                    }}>
                    <ArrowDown className="w-[2vw] h-[2vw] group-[.is-hovered]:animate-pulse"
                        aria-hidden="true"
                    />
                    <span className="group-[.is-hovered]:animate-pulse">Player 1 (Human)</span>
                    <ArrowDown className="w-[2vw] h-[2vw] group-[.is-hovered]:animate-pulse"
                        aria-hidden="true"
                    />
                </p>
                <p className={`group ${isHoveredNeuronInInputLayerPlayer2(hoverState.hoveredNeuron) ? "is-hovered opacity-75" : ""} transition-opacity duration-200 col-span-1 md:col-span-3 justify-self-start flex justify-around items-center text-blue-400 font-bold outline-2 outline-slate-500 rounded-full shadow-inner text-shadow-md text-shadow-blue-900`}
                    style={{
                        fontSize: "1.75vw",
                        width: "24vw",
                        padding: "0.25vw"
                    }}>
                    <ArrowDown className="w-[2vw] h-[2vw] group-[.is-hovered]:animate-pulse"
                        aria-hidden="true"
                    />
                    <span className="group-[.is-hovered]:animate-pulse">Player 2 (AI)</span>
                    <ArrowDown className="w-[2vw] h-[2vw] group-[.is-hovered]:animate-pulse"
                        aria-hidden="true"
                    />
                </p>
            </div>
            <svg aria-label="Neural network diagram" width={config.innerWidth * appState.window.vw} height={config.innerHeight * appState.window.vw}>
                {/* Render the connections between neurons first so they are behind the neurons */}
                {network.map((layer, i) => {
                    if (i === network.length - 1) return null; // last layer has no outgoing connections

                    const nextLayer = network[i + 1];
                    const layerActivationMax = getLayerActivationMax(layer) * getLayerActivationMax(nextLayer);

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
                                    vw={appState.window.vw}
                                    x1={x1}
                                    y1={y1}
                                    x2={x2}
                                    y2={y2}
                                    activation={intensity}
                                    maxActivation={layerActivationMax}
                                    hidden={!expanded}
                                />
                            );
                        });
                    });
                })}

                {/* Render the neurons for each layer */}
                {
                    network.map((layer, i) => {
                        const layerType: LayerType = getLayerType(i, config.totalLayers);
                        const layerActivationMax = getLayerActivationMax(layer);
                        return (
                            <g key={`layer-${i}`} role="treeitem" aria-label={getLayerAltText(i, layerType)}>
                                {
                                    Array.from({ length: layer.size }).map((_, j) => {
                                        const activation = layer.activations ? layer.activations[j] : 0;
                                        return (
                                            <Neuron
                                                key={`neuron-${i}-${j}`}
                                                vw={appState.window.vw}
                                                x={getNeuronX(j, layer.size, config)}
                                                y={getNeuronY(i, config)}
                                                fill={getNeruonFill(layerType, j)}
                                                motionDelay={getMotionDelay(i, j)}
                                                activation={activation}
                                                maxActivation={layerActivationMax}
                                                showText={showNeuronText}
                                                emphasized={isEmphasized(i, j)}
                                                onMouseEnter={() => handleNeuronHover({ layerIndex: i, neuronIndex: j })}
                                                onMouseLeave={() => handleNeuronHover(null)}
                                            />
                                        )
                                    })
                                }
                            </g>
                        )
                    })
                }
            </svg>
            <NeuronMathOverlay visible={overlayVisible && expanded} anchor={overlayAnchor} data={overlayData} />
            {/* This section is animated when the output layer is hovered over */}
            <div className={`group ${isHoveredNeuronInOutputLayer(hoverState.hoveredNeuron, config) ? "is-hovered opacity-75" : ""} transition-opacity duration-200 flex flex-row justify-center items-center gap-[1vw] text-amber-400 font-bold text-shadow-md text-shadow-amber-900`}>
                <ArrowUp className="w-[2vw] h-[2vw] group-[.is-hovered]:animate-pulse" 
                    aria-hidden="true" />
                <span
                    className="group-[.is-hovered]:animate-pulse"
                    style={{
                        fontSize: "1.5vw",
                    }}
                    aria-label="The best moves for AI are the outputs of the neural network"
                >
                    Best Moves for AI
                </span>
                <ArrowUp className="w-[2vw] h-[2vw] group-[.is-hovered]:animate-pulse" 
                    aria-hidden="true" />
            </div>
        </div>
    )
}
