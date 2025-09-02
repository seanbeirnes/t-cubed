import type { Layer, LayerType, NeuronFill } from "../types";
import { LAYER_TYPES, NEURON_FILLS } from "../types";

import { motion } from "motion/react";
import { useState } from "react";
import Neuron from "./Neuron";
import Connection from "./Connection";

const PADDING: number = 2;
const INNER_PADDING: number = 1;
const NEURON_WIDTH: number = 2;
const LAYER_MARGIN: number = 6;

interface NNAnimationPanelProps {
    width: number;
    network: Layer[];
    boardState: string[];
}

type Config = {
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

export default function NNAnimationPanel({ width, network, boardState }: NNAnimationPanelProps) {
    const config: Config = getConfig(width, network);

    const offsetOpen: number = 0;
    const offsetClosed: number = -(config.totalLayers - 1) * (config.neuronWidth + config.layerSpacing);
    const [offset, setOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(offsetClosed);

    return (
        <div id="nn-animation-panel" style={
            {
                width: `${config.width}vw`,
                height: `${config.height + 4}vw`,
                padding: `${config.padding}vw`,
                bottom: `${offset}vw`,
            }} className={`absolute transition-all bg-slate-500 rounded-t-2xl shadow-2xl z-10`}
            onClick={() => offset === offsetOpen ? setOffset(offsetClosed) : setOffset(offsetOpen)}>
            <div className="flex flex-row justify-between">
                <div></div>
                <p className="text-green-400 font-bold" style={{fontSize: "2vw"}}>Player 1 (Human)</p>
                <p className="text-blue-400 font-bold" style={{fontSize: "2vw"}}>Player 2 (AI)</p>
                <div></div>
            </div>
            <svg width={`${config.innerWidth}vw`} height={`${config.innerHeight}vw`}>
                {/* Render the connections between neurons first so they are behind the neurons */}
                {network.map((layer, i) => {
                    if (offset === offsetClosed) return null;
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
                <motion.rect
                    key={`connections-mask-${offset}`}
                    x={0}
                    y={0}
                    width={`${config.width - (config.padding * 2)}vw`}
                    height={`${config.height - (config.padding * 2)}vw`}
                    fill="oklch(55.4% 0.046 257.417)"
                    animate={{
                        opacity: [1, 0],
                        transition: {
                            duration: 0.5,
                            ease: "easeInOut",
                            delay: 0.5,
                        }
                    }}
                />


                {/* Render the neurons for each layer */}
                {
                    network.map((layer, i) => {
                        const layerType: LayerType = getLayerType(i, config.totalLayers);
                        return Array.from({ length: layer.size }).map((_, j) => {
                            const activation = layer.activations ? layer.activations[j] : 0;
                            return (
                                <Neuron
                                    key={`neuron-${i}-${j}`}
                                    x={getNeuronX(j, layer.size, config)}
                                    y={getNeuronY(i, config)}
                                    fill={getNeruonFill(layerType, j)}
                                    motionDelay={getMotionDelay(i, j)}
                                    activation={activation}
                                />
                            )
                        })
                    })
                }
            </svg>
            <div className="flex flex-row justify-center">
                <p className="text-amber-400 font-bold" style={{fontSize: "1.5vw"}}>Chosen Move</p>
            </div>
        </div>
    )
}
