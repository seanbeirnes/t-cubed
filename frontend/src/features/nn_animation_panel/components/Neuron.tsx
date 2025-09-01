import type { NeuronFill } from "../types";

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
    x: number;
    y: number;
    fill: NeuronFill;
    motionDelay: number;
    activation: number;
}

export default function Neuron({ x, y, fill, motionDelay, activation }: NeuronProps) {
    return (
        <g>
            <motion.circle
                cx={`${x}vw`}
                cy={`${y}vw`}
                r="1vw"
                fill="#FFF"
                fillOpacity={(activation ** 2)}
                className={`blur-xs transition-opacity`}
                custom={motionDelay}
                initial="hidden"
                whileInView="visible"
                variants={nodeAnimationProps}
            />
            <motion.circle
                cx={`${x}vw`}
                cy={`${y}vw`}
                r="0.9vw"
                fill={fill}
                fillOpacity="0.5"
                stroke="#FFF"
                strokeWidth="0.1vw"
                custom={motionDelay}
                initial="hidden"
                whileInView="visible"
                variants={nodeAnimationProps}
            />
        </g>
    )
}
