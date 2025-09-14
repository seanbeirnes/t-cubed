import type { Window } from "./window";

export const APP_STATE_ACTIONS = {
    WINDOW_RESIZE: "WINDOW_RESIZE",
}

type AppStateActions = typeof APP_STATE_ACTIONS[keyof typeof APP_STATE_ACTIONS];

export type AppStateAction = {
    type: AppStateActions;
    payload: Window | null;
}
