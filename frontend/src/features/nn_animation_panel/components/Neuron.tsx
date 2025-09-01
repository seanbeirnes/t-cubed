import { motion } from "motion/react";

const nodeAnimationProps = {
    visible: (customDelay: number) => ({
        scale: [0, 1],
        transition: {
            delay: customDelay,
        }
    }),
    hidden: {
        scale: 0,
    }
}

interface NeuronProps {
    layerIndex: number;
    neuronIndex: number;
    networkLength: number;
}

export default function Neuron({layerIndex, neuronIndex, networkLength}: NeuronProps) {
                            return (
                                <g>
                                    <motion.circle
                                        cx={`${(neuronIndex * 2.75) + 2}vw`}
                                        cy={`${(layerIndex * 8) + 2}vw`}
                                        r="0.9vw"
                                        fill={`${layerIndex === 0 && neuronIndex < 9 ? "#00FF50" : layerIndex === 0 && neuronIndex >= 9 ? "#0050FF" : layerIndex === networkLength - 1 ? "#AFAA00" : "#AAA"}`}
                                        fillOpacity="0.5"
                                        stroke="#FFF"
                                        strokeWidth="0.1vw"
                                        custom={(layerIndex + neuronIndex + 1) * 0.01}
                                        initial="hidden"
                                        whileInView="visible"
                                        variants={nodeAnimationProps}
                                    />
                                    <motion.circle
                                        cx={`${(neuronIndex * 2.75) + 2}vw`}
                                        cy={`${(layerIndex * 8) + 2}vw`}
                                        r="1vw"
                                        fill="#FFF"
                                        fillOpacity="0.5"
                                        className={`blur-xs transition-opacity`}
                                        custom={(layerIndex + neuronIndex + 1) * 0.01}
                                        initial="hidden"
                                        whileInView="visible"
                                        variants={nodeAnimationProps}
                                    />
                                </g>
                            )
}
