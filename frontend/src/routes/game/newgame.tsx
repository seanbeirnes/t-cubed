import { createFileRoute } from '@tanstack/react-router'

import { GameViewHeader } from '../../shared/components/layout/GameViewHeader';

export type GameTypeOptions = 'mm' | 'nn' | ''

// Game type (minimax or neural net)
export type NewGameRouteParams = {
    gt: GameTypeOptions
}

export const Route = createFileRoute('/game/newgame')({
    component: NewGame,
    validateSearch: (search: Record<string, unknown>): NewGameRouteParams => {
        return {
            gt: (search.gt as GameTypeOptions)  || ''
        }
    }
})

function NewGame() {
    const {gt} = Route.useSearch()
    console.log(gt)
    if (gt === "") {
        window.location.href = "/"
    }
    return (
        <div className="h-screen min-h-158 md:min-h-188 bg-slate-600 flex flex-col overflow-clip">
            <GameViewHeader subtitle="Play Tic-Tac-Toe against Minimax, a classic AI algorithm." />
            <main className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">

            </main>
        </div>
    )
}
