import { createFileRoute, Link } from '@tanstack/react-router'

import { motion } from "motion/react"

import NNGameController from '../../features/nn_game_controller/components/NNGameController';

const containerVariants = {
    rest: { scale: 1, boxShadow: "0px 2px 6px rgba(0,0,0,0.2)" },
    hover: { scale: 1.05, boxShadow: "0px 8px 20px rgba(0,0,0,0.25)" },
}

const titleVariants = {
    rest: { scale: 1, opacity: 1 },
    hover: { scale: 1.15, opacity: 0.9 },
}

const subtitleVariants = {
    rest: { y: 0, opacity: 1 },
    hover: { y: -2, opacity: 0.85 },
}

export const Route = createFileRoute('/game/nn')({
    component: NN,
})

function NN() {

    const animationPanelWidth: number = 93.25;
    const mainPadding: number = (100 - animationPanelWidth) / 2;

    return (
        <>
            {/* Use min-h to prevent the game boar from clipping when window height is too small */}
            <div className="h-screen min-h-158 md:min-h-188 bg-slate-600 flex flex-col overflow-clip">
                <header className="p-2 flex flex-col items-center gap-2 lg:flex-row lg:justify-between lg:items-start z-100">
                    <div className="w-40">
                    </div>
                    <motion.div
                        variants={containerVariants}
                        initial="rest"
                        whileHover="hover"
                        animate="rest"
                        transition={{ type: "spring", stiffness: 250, damping: 15 }}
                        className="w-fit rounded-full"
                    >
                        <Link
                            to="/"
                            className="flex flex-col items-center justify-center py-2 px-16 bg-slate-500 rounded-full shadow-inner hover:bg-slate-400/50 transition-all duration-200"
                        >
                            <motion.h1
                                variants={titleVariants}
                                transition={{ type: "spring", stiffness: 300, damping: 12 }}
                                title="T-Cubed"
                                className="text-xl md:text-4xl font-bold text-amber-400 drop-shadow"
                            >
                                T<sup>3</sup>
                            </motion.h1>

                            <motion.p
                                variants={subtitleVariants}
                                transition={{ duration: 0.25 }}
                                className="text-sm md:text-base text-slate-200"
                            >
                                Play Tic-Tac-Toe against a neural-network-powered AI
                            </motion.p>
                        </Link>
                    </motion.div>
                    <div className="flex flex-row justify-start gap-1 text-sm text-slate-200 lg:flex-col lg:items-center">
                        <p>Created by&nbsp;
                            <a className="text-amber-500 hover:text-amber-300 underline" href="https://seanbeirnes.com" rel="noreferrer" target="_blank">
                                Sean Beirnes
                            </a>
                        </p>
                        <span className="lg:hidden">&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                        <p>See the code on&nbsp;
                            <a className="text-amber-500 hover:text-amber-300 underline" href="https://github.com/seanbeirnes/t-cubed" rel="noreferrer" target="_blank">
                                GitHub
                            </a>
                        </p>
                    </div>
                </header>
                <main style={{ padding: `0 ${mainPadding}vw 0 ${mainPadding}vw` }} className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                    <NNGameController animationPanelWidth={animationPanelWidth} />
                </main>
            </div>
        </>
    )
}
