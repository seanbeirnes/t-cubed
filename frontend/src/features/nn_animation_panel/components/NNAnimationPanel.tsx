import type { Layer, LayerType, NeuronFill } from "../types";
import { LAYER_TYPES, NEURON_FILLS } from "../types";

import { useState } from "react";
import Neuron from "./Neuron";

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

export default function NNAnimationPanel({ width, network, boardState }: NNAnimationPanelProps) {
    const config: Config = getConfig(width, network);

    const offsetOpen: number = 0;
    const offsetClosed: number = -(config.totalLayers - 1) * (config.neuronWidth + config.layerSpacing);
    const [offset, setOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(offsetClosed);

    return (
        <div id="nn-animation-panel" style={
            {
                width: `${config.width}vw`,
                height: `${config.height}vw`,
                padding: `${config.padding}vw`,
                bottom: `${offset}vw`,
            }} className={`absolute transition-all bg-slate-500 rounded-t-2xl shadow-2xl z-10`}
            onClick={() => offset === offsetOpen ? setOffset(offsetClosed) : setOffset(offsetOpen)}>
            <svg width={`${innerWidth}vw`} height={`${innerHeight}vw`}>
                {
                    network.map((layer, i) => {
                        const layerType: LayerType = getLayerType(i, config.totalLayers);
                        return Array.from({ length: layer.size }).map((_, j) => {
                            return (
                                <Neuron
                                    key={`neuron-${i}-${j}`}
                                    x={getNeuronX(j, layer.size, config)}
                                    y={getNeuronY(i, config)}
                                    fill={getNeruonFill(layerType, j)}
                                    motionDelay={(i + j + 1) * 0.01}
                                    activation={layer.activations ? layer.activations[j] : 0}
                                />
                            )
                        })
                    })
                }
            </svg>
        </div>
    )
}
