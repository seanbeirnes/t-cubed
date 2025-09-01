import type { Layer } from "./features/nn_animation_panel";
import { NNAnimationPanel } from "./features/nn_animation_panel";

const boardSate: string[] = ["X", "0", "_", "_", "_", "X", "_", "_", "_"]

const network: Layer[] = [
    { size: 18 },
    { size: 32 },
    { size: 32 },
    { size: 32 },
    { size: 9 },
];

function App() {
    const animationPanelWidth: number = 93.25;
    const mainPadding: number = (100 - animationPanelWidth)/2;

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
            <main style={{padding: `${mainPadding}vw`}} className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                <div>
                    board goes here
                </div>
                <NNAnimationPanel width={animationPanelWidth} network={network} boardState={boardSate}/>
            </main>
        </div>
    )
}

export default App
