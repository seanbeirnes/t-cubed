import { createFileRoute } from '@tanstack/react-router'

import { GameViewHeader } from '../../shared/components/layout/GameViewHeader';
import { useMemo, useState } from 'react';

export type GameTypeOptions = 'mm' | 'nn' | ''

// Game type (minimax or neural net)
export type NewGameRouteParams = {
    gt: GameTypeOptions
}

export const Route = createFileRoute('/game/newgame')({
    component: NewGame,
    validateSearch: (search: Record<string, unknown>): NewGameRouteParams => {
        return {
            gt: (search.gt as GameTypeOptions) || ''
        }
    }
})

function NewGame() {
    const { gt } = Route.useSearch()
    if (gt !== 'mm' && gt !== 'nn') {
        window.location.href = "/"
    }

    const [name, setName] = useState('')
    const [piece, setPiece] = useState<'X' | 'O'>('X')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const gameTypeLabel = useMemo(
        () => (gt === 'nn' ? 'neural_network' : 'minimax'),
        [gt]
    )

    const otherPiece = piece === 'X' ? 'O' : 'X'

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) {
            setError('Please enter a game name.')
            return
        }
        setError(null)
        setSubmitting(true)
        try {
            const res = await fetch('/api/v1/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    game_type: gameTypeLabel,
                    player_1_piece: piece,
                    player_2_piece: otherPiece,
                    next_player_id: '1',
                    ai_player_id: '2',
                }),
            })
            if (!res.ok) {
                const t = await res.text()
                throw new Error(t || 'Failed to create game')
            }
            const data: {
                uuid: string
                name: string
                game_type: 'neural_network' | 'minimax'
            } = await res.json()

            const path =
                data.game_type === 'neural_network'
                    ? `/game/${data.uuid}/nn`
                    : `/game/${data.uuid}/minimax`

            window.location.href = path
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Something went wrong'
            setError(msg)
            setSubmitting(false)
        }
    }

    return (
        <div className="h-screen min-h-158 md:min-h-188 bg-slate-600 flex flex-col overflow-clip">
            <GameViewHeader subtitle="Play Tic-Tac-Toe against Minimax, a classic AI algorithm." />
            <main className="relative w-full h-full flex flex-col justify-start items-center bg-slate-600">
                <div className="flex flex-col items-start gap-4 mt-4 p-8 shadow-2xl rounded-2xl">
                <h2 className="text-3xl font-bold text-amber-400">Challenge {gt === 'nn' ? 'a Neural Network' : 'Minimax'}!</h2>
                <p className="text-base text-slate-200">Name your match and choose your piece.</p>
                <form onSubmit={handleSubmit} className="w-full md:w-100 space-y-6">
                    <div>
                        <label htmlFor="game-name" className="block text-sm font-bold text-slate-200 mb-2">
                            Game name
                        </label>
                        <input
                            id="game-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter a game name"
                            className={[
                                'w-full rounded-xl bg-slate-800/60 text-slate-100 placeholder:text-slate-400',
                                'ring-1 ring-inset ring-slate-500/40 focus:ring-2 focus:ring-amber-300 outline-none',
                                'px-4 py-3 transition-shadow shadow-inner',
                            ].join(' ')}
                        />
                    </div>

                    <div>
                        <span className="block text-sm font-medium text-slate-200 mb-2">
                            Choose your piece
                        </span>
                        <div className="w-full inline-flex items-center gap-3">
                            {(['X', 'O'] as const).map((opt) => {
                                const active = piece === opt
                                return (
                                    <button
                                        type="button"
                                        key={opt}
                                        onClick={() => setPiece(opt)}
                                        className={[
                                            'px-6 py-4 rounded-xl ring-1 ring-inset transition-all backgrop-blur-sm',
                                            active
                                                ? 'bg-gradient-to-br from-amber-500/25 to-amber-400/10 text-amber-200 ring-amber-400 shadow'
                                                : 'bg-slate-800/50 text-slate-200 ring-slate-500/40 hover:ring-slate-400',
                                        ].join(' ')}
                                        aria-pressed={active}
                                    >
                                        {opt}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-lg bg-red-500/15 ring-1 ring-red-400/40 text-red-200 px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="w-full flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={submitting}
                            className={[
                                'w-full inline-flex items-center justify-center',
                                'rounded-xl px-8 py-2 font-semibold',
                                'bg-gradient-to-br from-amber-400 to-amber-500 text-slate-900',
                                'shadow-lg hover:shadow-xl hover:opacity-90 transition-all',
                                'active:shadow-inner',
                                'disabled:opacity-60 disabled:cursor-not-allowed',
                            ].join(' ')}
                        >
                            Start Game
                        </button>
                        <a
                            href="/"
                            className="text-slate-200 hover:text-amber-300 transition-colors text-sm"
                        >
                            Cancel
                        </a>
                    </div>
                </form>
                </div>
            </main >
        </div>
    )
}
