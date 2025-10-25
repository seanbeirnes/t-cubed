import type { NeuronFill } from "../types";

import { motion } from "motion/react";

// @ts-expect-error
const isSafari = window.safari !== undefined;

// Safari doesn't support scale animations with motion
const nodeAnimationProps = {
    visible: (customDelay: number) => ({
        scale: isSafari ? 1 : [0, 1],
        transition: {
            delay: customDelay,
        }
    }),
    hidden: {
        scale: isSafari ? 1 : 0,
        opacity: 1,
        fillOpacity: 1,
    }
}

interface NeuronProps {
    vw: number;
    x: number;
    y: number;
    fill: NeuronFill;
    motionDelay: number;
    activation: number;
    maxActivation: number;
    showText?: boolean;
    emphasized?: boolean;
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

function activationToText(activation: number): string {
    if (activation >= 100) return activation.toFixed(0);
    if (activation >= 10) return activation.toFixed(1);
    return activation.toFixed(2);
}

export default function Neuron({ vw, x, y, fill, motionDelay, activation, maxActivation, showText = true, emphasized = false, onMouseEnter, onMouseLeave }: NeuronProps) {
    return (
        <g
            aria-label={`Activation: ${activation.toFixed(2)}`}
            role="img"
        >
            {/* Only show the neuron if the activation is greater than 0.01 to cull number of nodes to animate */}
            {activation > 0.01 && <motion.circle
                cx={x * vw}
                cy={y * vw}
                r={1 * vw}
                className={`blur-xs transition-opacity ${emphasized ? "fill-amber-400" : "fill-white"}`}
                custom={motionDelay}
                initial="hidden"
                whileInView="visible"
                variants={nodeAnimationProps}
                animate={{ opacity: (activation/maxActivation) ** 2 }}
                aria-hidden="true"
            /> }
            <motion.circle
                cx={x * vw}
                cy={y * vw}
                r={0.9 * vw}
                fill={fill}
                strokeWidth={0.1 * vw}
                className={`${emphasized ? "stroke-amber-400" : "stroke-white"}`}
                custom={motionDelay}
                initial="hidden"
                whileInView="visible"
                variants={nodeAnimationProps}
                animate={{ fillOpacity: activation === 0 ? 0 : ((activation/maxActivation) ** 2 + 0.15) * 0.6 }}
                aria-hidden="true"
            />
            {showText && (
                <motion.text
                    x={x * vw}
                    y={y * vw}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={getContrastColor(fill)}
                    fontSize={0.78 * vw}
                    custom={motionDelay}
                    initial="hidden"
                    whileInView="visible"
                    variants={nodeAnimationProps}
                    animate={{ opacity: activation === 0 ? 0 : (activation/maxActivation) + 0.5 }}
                    aria-hidden="true"
                >
                    {activationToText(activation)}
                </motion.text>
            )}
            <motion.circle
                cx={x * vw}
                cy={y * vw}
                r={1 * vw}
                fill="transparent"
                aria-hidden="true"
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            />
        </g>
    )
}
