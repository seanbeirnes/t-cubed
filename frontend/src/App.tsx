import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

import type { AppState, AppStateAction } from "./shared/types";
import { APP_STATE_ACTIONS } from "./shared/types";
import { createContext, useEffect, useReducer, type Dispatch } from "react";

const router = createRouter({ routeTree })

// Register the router instance for type safety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}

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
                    vw: action.payload.vw,
                    vh: action.payload.vh,
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
        vw: window.innerWidth/100,
        vh: window.innerHeight/100,
    }
}

export const AppStateContext = createContext<AppState>(initialAppState);
export const AppStateDispatchContext = createContext<Dispatch<AppStateAction>>(() => { });

export default function App() {
    const [appState, dispatch] = useReducer(appStateReducer, initialAppState);

    useEffect(() => {
        window.addEventListener("resize", () => {
            dispatch({
                type: APP_STATE_ACTIONS.WINDOW_RESIZE,
                payload: {
                    width: window.innerWidth,
                    height: window.innerHeight,
                    vw: window.innerWidth/100,
                    vh: window.innerHeight/100,
                }
            })
        });
    }, []);

    return (
        <AppStateContext.Provider value={appState}>
            <AppStateDispatchContext.Provider value={dispatch}>
                <RouterProvider router={router} />
            </AppStateDispatchContext.Provider>
        </AppStateContext.Provider>
    )
}
