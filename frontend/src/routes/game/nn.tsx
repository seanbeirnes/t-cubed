import { createFileRoute } from '@tanstack/react-router'

import NNGameController from '../../features/nn_game_controller/components/NNGameController';
import { GameViewHeader } from '../../shared/components/layout/GameViewHeader';

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
                <GameViewHeader subtitle="Play Tic-Tac-Toe against a neural-network-powered AI" />
                <main style={{ padding: `0 ${mainPadding}vw 0 ${mainPadding}vw` }} className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                    <NNGameController animationPanelWidth={animationPanelWidth} />
                </main>
            </div>
        </>
    )
}
