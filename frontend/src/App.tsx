import type { AppState, AppStateAction} from "./shared/types";
import type { Layer } from "./features/nn_animation_panel";
import { APP_STATE_ACTIONS } from "./shared/types";
import { NNAnimationPanel } from "./features/nn_animation_panel";
import { createContext, useEffect, useReducer, type Dispatch } from "react";

const boardSate: string[] = ["X", "0", "_", "_", "_", "X", "_", "_", "_"]

const network: Layer[] = [
    {
        size: 18,
        activations: [
            0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0,
        ],
    },
    {
        size: 32,
        activations: [
            0.41, 0.88, 0.12, 0.66, 0.27, 0.73, 0.34, 0.51, 0.99, 0.18,
            0.47, 0.62, 0.05, 0.83, 0.39, 0.74, 0.21, 0.56, 0.68, 0.91,
            0.02, 0.77, 0.36, 0.49, 0.15, 0.88, 0.63, 0.05, 0.92, 0.28,
            0.54, 0.79,
        ],
    },
    {
        size: 32,
        activations: [
            0.07, 0.63, 0.52, 0.95, 0.31, 0.48, 0.12, 0.77, 0.84, 0.20,
            0.39, 0.56, 0.68, 0.91, 0.03, 0.72, 0.44, 0.87, 0.29, 0.66,
            0.14, 0.53, 0.98, 0.37, 0.61, 0.19, 0.85, 0.25, 0.79, 0.43,
            0.57, 0.90,
        ],
    },
    {
        size: 32,
        activations: [
            0.22, 0.59, 0.81, 0.14, 0.67, 0.35, 0.92, 0.48, 0.03, 0.76,
            0.41, 0.88, 0.29, 0.55, 0.71, 0.16, 0.64, 0.37, 0.99, 0.23,
            0.50, 0.80, 0.12, 0.68, 0.44, 0.97, 0.31, 0.58, 0.84, 0.07,
            0.61, 0.33,
        ],
    },
    {
        size: 9,
        activations: [0.14, 0.76, 0.33, 0.89, 0.21, 0.65, 0.47, 0.09, 0.38],
    },
];

function appStateReducer(state: AppState, action: AppStateAction): AppState {
    switch (action.type) {
        case APP_STATE_ACTIONS.WINDOW_RESIZE:
            if (action.payload === null) {
                return state;
            }
            return {
                ...state,
                window: {
                    ...state.window,
                    width: action.payload.width,
                    height: action.payload.height,
                }
            }
        default:
            return state;
    }
}

const initialAppState: AppState = {
    window: {
        width: window.innerWidth,
        height: window.innerHeight,
    }
}

export const AppStateContext = createContext<AppState>(initialAppState);
export const AppStateDispatchContext = createContext<Dispatch<AppStateAction>>(() => { });

function App() {
    const animationPanelWidth: number = 93.25;
    const mainPadding: number = (100 - animationPanelWidth) / 2;

    const [appState, dispatch] = useReducer(appStateReducer, initialAppState);

    useEffect(() => {
        window.addEventListener("resize", () => {
            dispatch({
                type: APP_STATE_ACTIONS.WINDOW_RESIZE,
                payload: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                }
            })
        });
    }, []);

    return (
        <AppStateContext.Provider value={appState}>
            <AppStateDispatchContext.Provider value={dispatch}>
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
                    <main style={{ padding: `${mainPadding}vw` }} className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                        <div>
                            board goes here
                        </div>
                        <NNAnimationPanel width={animationPanelWidth} network={network} boardState={boardSate} />
                    </main>
                </div>
            </AppStateDispatchContext.Provider>
        </AppStateContext.Provider>
    )
}

export default App
