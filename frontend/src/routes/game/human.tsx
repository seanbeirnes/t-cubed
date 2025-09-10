import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/human')({
  component: Minimax,
})

function Minimax() {
  return <div className="p-2 text-white">Hello from Human!</div>
}
