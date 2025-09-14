import { createFileRoute } from '@tanstack/react-router'

import { GameViewHeader } from '../../shared/components/layout/GameViewHeader';

export const Route = createFileRoute('/game/minimax')({
  component: Minimax,
})

function Minimax() {
    return (
            <div className="h-screen min-h-158 md:min-h-188 bg-slate-600 flex flex-col overflow-clip">
                <GameViewHeader subtitle="Play Tic-Tac-Toe against Minimax, a classic AI algorithm." />
                <main className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                </main>
            </div>
    )
}
