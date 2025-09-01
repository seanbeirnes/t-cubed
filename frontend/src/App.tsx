import { delay, motion, stagger } from "motion/react";
import { useState } from "react";

type Layer = {
    size: number;
}

const network: Layer[] = [
    { size: 18 },
    { size: 32 },
    { size: 32 },
    { size: 32 },
    { size: 9 },
];

const nodeAnimationProps = {
    visible: (customDelay: number) => ({
        scale: [0.01, 1.1, 1],
        transition: {
            delay: customDelay,
        }
    }),
    hidden: {
        scale: 0,
    }
}

function App() {
    const offsetClosed: number = -33;
    const offsetOpen: number = 0;

    const [offset, setOffset]: [number, React.Dispatch<React.SetStateAction<number>>] = useState(offsetClosed);

    return (
        <div className="h-screen bg-slate-600 flex flex-col justify-between overflow-clip">
            <header className="p-2 flex flex-col items-center gap-2 lg:flex-row lg:justify-between lg:items-start">
                <div className="w-40">
                </div>
                <div className="flex flex-col items-center justify-center w-fit py-2 px-16 bg-slate-500 rounded-full shadow-inner">
                    <h1 title="T-Cubed" className="text-xl md:text-4xl font-bold text-amber-500">
                        T<sup>3</sup>
                    </h1>
                    <p className="text-sm md:text-base text-slate-200">Play Tic-Tac-Toe against a neural-network-powered AI</p>
                </div>
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
            <main style={{padding: "3.375vw"}} className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                <div>
                    board goes here
                </div>
                <div id="animation-panel" style={
                    {
                        width: "93.25vw",
                        height: "40vw",
                        padding: "2vw",
                        bottom: `${offset}vw`,
                    }} className={`absolute transition-all bg-slate-500 rounded-t-2xl shadow-2xl z-10`}
                    onClick={() => offset === offsetOpen ? setOffset(offsetClosed) : setOffset(offsetOpen)}>
                    <svg width="89.25vw" height="36vw">
                        {
                            network.map((layer, i) => {
                                return Array.from({ length: layer.size }).map((_, j) => {
                                    return (
                                        <g key={`layer-${i}-${j}`}>
                                            <motion.circle
                                                cx={`${(j * 2.75) + 2}vw`}
                                                cy={`${(i * 8) + 2}vw`}
                                                r="0.9vw"
                                                fill={`${i === 0 && j < 9 ? "#00FF50" : i === 0 && j >= 9 ? "#0050FF" : i === network.length - 1 ? "#AFAA00" : "#AAA"}`}
                                                fillOpacity="0.5"
                                                stroke="#FFF"
                                                strokeWidth="0.1vw"
                                                custom={(i + j + 1) * 0.01}
                                                initial="hidden"
                                                whileInView="visible"
                                                variants={nodeAnimationProps}
                                            />
                                            <motion.circle
                                                cx={`${(j * 2.75) + 2}vw`}
                                                cy={`${(i * 8) + 2}vw`}
                                                r="1vw"
                                                fill="#FFF"
                                                fillOpacity="0.5"
                                                className={`blur-xs transition-opacity`}
                                                custom={(i + j + 1) * 0.01}
                                                initial="hidden"
                                                whileInView="visible"
                                                variants={nodeAnimationProps}
                                            />
                                        </g>
                                    )
                                })
                            })
                        }
                    </svg>
                </div>
            </main>
        </div>
    )
}

export default App
