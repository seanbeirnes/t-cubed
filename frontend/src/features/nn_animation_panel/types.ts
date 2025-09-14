export type Layer = {
    size: number
    activations?: number[]
}

export const LAYER_TYPES = {
    INPUT: "input",
    HIDDEN: "hidden",
    OUTPUT: "output",
}

export type LayerType = typeof LAYER_TYPES[keyof typeof LAYER_TYPES];

export const NEURON_FILLS = {
    INPUT_PLAYER_1: "#00FF50",
    INPUT_PLAYER_2: "#0050FF",
    HIDDEN: "#AAA",
    OUTPUT: "#AFAA00",
} 

export type NeuronFill = typeof NEURON_FILLS[keyof typeof NEURON_FILLS];
