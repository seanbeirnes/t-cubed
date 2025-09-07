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
        opacity: 1,
        fillOpacity: 1,
    }
}

interface NeuronProps {
    x: number;
    y: number;
    fill: NeuronFill;
    motionDelay: number;
    activation: number;
    showText?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

function normalizeHex(hex: string): string {
    const clean = hex.replace("#", "");
    if (clean.length === 3) {
        return clean.split("").map(c => c + c).join("");
    }
    return clean;
}

// Used to get the contrast color for text based on fill color of neuron
function getContrastColor(hex: string): string {
    const cleanHex = normalizeHex(hex);
    const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    const g = parseInt(cleanHex.substring(2, 2), 16) / 255;
    const b = parseInt(cleanHex.substring(4, 2), 16) / 255;

    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Contrast ratios against white and black
    const contrastWithWhite = (1.05) / (luminance + 0.05);
    const contrastWithBlack = (luminance + 0.05) / 0.05;

    return contrastWithWhite > contrastWithBlack ? "#EEE" : "#333";
}


export default function Neuron({ x, y, fill, motionDelay, activation, showText = true, onMouseEnter, onMouseLeave }: NeuronProps) {
    return (
        <g
            aria-label={`Activation: ${activation.toFixed(2)}`}
            role="img"
        >
            <motion.circle
                cx={`${x}vw`}
                cy={`${y}vw`}
                r="1vw"
                fill="#FFF"
                className={`blur-xs transition-opacity`}
                custom={motionDelay}
                initial="hidden"
                whileInView="visible"
                variants={nodeAnimationProps}
                animate={{ opacity: activation ** 2 }}
                aria-hidden="true"
            />
            <motion.circle
                cx={`${x}vw`}
                cy={`${y}vw`}
                r="0.9vw"
                fill={fill}
                stroke="#FFF"
                strokeWidth="0.1vw"
                custom={motionDelay}
                initial="hidden"
                whileInView="visible"
                variants={nodeAnimationProps}
                animate={{ fillOpacity: (activation ** 2 + 0.15) * 0.6 }}
                aria-hidden="true"
            />
            {showText && (
                <motion.text
                    x={`${x}vw`}
                    y={`${y}vw`}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={getContrastColor(fill)}
                    fontSize="0.78vw"
                    custom={motionDelay}
                    initial="hidden"
                    whileInView="visible"
                    variants={nodeAnimationProps}
                    animate={{ opacity: activation === 0 ? 0 : activation + 0.1 }}
                    aria-hidden="true"
                >
                    {activation.toFixed(2)}
                </motion.text>
            )}
            <motion.circle
                cx={`${x}vw`}
                cy={`${y}vw`}
                r="1vw"
                fill="transparent"
                aria-hidden="true"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            />
        </g>
    )
}
