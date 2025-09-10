import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/nn')({
  component: Minimax,
})

function Minimax() {
  return <div className="p-2 text-white">Hello from Neural Network!</div>
}
