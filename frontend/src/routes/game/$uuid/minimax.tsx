import { createFileRoute, useParams } from '@tanstack/react-router'

import { GameViewHeader } from '../../../shared/components/layout/GameViewHeader';
import { MinimaxGameController } from '../../../features/minimax_game_controller';

export const Route = createFileRoute('/game/$uuid/minimax')({
    component: Minimax,
})

function Minimax() {
    const {uuid} = useParams({strict: false});

    return (
        <div className="h-screen min-h-158 md:min-h-188 bg-slate-600 flex flex-col overflow-clip">
            <GameViewHeader subtitle="Play Tic-Tac-Toe against Minimax, a classic AI algorithm." />
            <main className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                <MinimaxGameController uuid={uuid || ''} />
            </main>
        </div>
    )
}
