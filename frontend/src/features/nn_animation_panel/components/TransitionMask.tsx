import { motion } from "motion/react";
import type { Config } from "./NNAnimationPanel";

interface TransitionMaskProps {
    config: Config;
    blocksPerRow: number;
    shortenDuration: boolean;
    hidden?: boolean;
}

export default function TransitionMask({config, blocksPerRow, shortenDuration, hidden=false}: TransitionMaskProps) {
    const blockWidth: number = (config.innerWidth - config.innerPadding) / blocksPerRow
    const totalBlocks: number = Math.ceil((config.innerHeight - config.innerPadding) / blockWidth) * blocksPerRow

        return (
                <motion.g 
                    className={`${hidden ? "hidden" : ""}`}>
                    {
                        [...Array(totalBlocks)].map((_, i) => (
                            <motion.rect
                                key={`masking-block-${i}`}
                                x={`${((i % blocksPerRow) * blockWidth) + (config.innerPadding / 2)}vw`}
                                y={`${(Math.floor(i / blocksPerRow) * blockWidth) + (config.innerPadding / 2)}vw`}
                                width={`${blockWidth + 0.1}vw`}
                                height={`${blockWidth + 0.1}vw`}
                                animate={{
                                    fill: [`oklch(44.6% 0.043 257.281)`, `oklch(${(Math.random() * 10) + 43}% 0.043 257.281)`, `oklch(44.6% 0.043 257.281)`],
                                    opacity: [0.95, 1, 1, 1, 1, 1, 1, 1, 0],
                                    scale: [1, 1, 1, 1, 1, 1, 1, 1, 0.9],
                                }}
                                transition={{
                                    fill: {
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                        duration: 1.2,
                                        delay: -1.2 + (i/totalBlocks) + Math.random() * 0.1
                                    },
                                    opacity: {
                                        duration: shortenDuration ? 0.0 : 0.8 + Math.random() * 0.4 + (i/totalBlocks),
                                    },
                                    scale: {
                                        duration: shortenDuration ? 0.0 : 1 + Math.random() * 0.2 + (i/totalBlocks),
                                    }
                                }}
                            />
                        ))}
                </motion.g>
    )
}
