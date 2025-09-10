import { createFileRoute, Link } from '@tanstack/react-router'
import { Brain, Swords, UserRound, ChevronRight } from 'lucide-react'
import { GolangIcon, DockerIcon, ReactIcon, TailwindIcon, TypeScriptIcon } from '../shared/components'

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return (
        <div className="h-screen w-full bg-slate-600 flex items-center justify-center overflow-clip">
            <div className="max-w-4xl w-full px-6">
                <header className="flex flex-col items-center text-center gap-3 mb-10">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-amber-400 drop-shadow">
                        Welcome to T<sup>3</sup>
                    </h1>
                    <p className="text-slate-200 text-base md:text-lg text-left">
                        Tic-Tac-Toe, reimagined — play a friend, challenge Minimax, or experience a neural network with beautiful live animations.
                    </p>
                </header>

                <main className="flex flex-col items-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                        <NavCard 
                            to="/game/human" 
                            title="Challenge Friends" 
                            description="Play a game online with anyone!"
                            icon={<UserRound className="w-6 h-6" />} 
                            color="from-green-500/20 to-green-400/10" ring="ring-green-400" />

                        <NavCard 
                            to="/game/minimax" 
                            title="Challenge Minimax AI"
                            description="Play against Minimax, a classic AI algorithm."
                            icon={<Swords className="w-6 h-6" />} 
                            color="from-blue-500/20 to-blue-400/10" ring="ring-blue-400" />

                        <NavCard
                            to="/game/nn"
                            title="Challenge Neural Net AI"
                            description="Play a neural network and see it in action!"
                            icon={<Brain className="w-6 h-6" />}
                            color="from-amber-500/25 to-amber-400/10"
                            ring="ring-amber-400"
                            featured
                        />
                    </div>
                </main>

                <footer className="mt-10 flex flex-col items-center gap-4">
                    <a
                        href="https://github.com/seanbeirnes/t-cubed"
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-2 text-slate-200 hover:text-amber-300 transition-colors"
                        title="View source on GitHub"
                    >
                        Explore the code 
                        <ChevronRight className="group-hover:translate-x-1 w-4 h-4 transition-transform" />
                    </a>

                    {/* Decorative tech badges */}
                    <div className="mt-2 flex items-center gap-3 bg-slate-700/50 px-4 py-2 rounded-full shadow-inner">
                        <TechStackBadge label="React" icon={<ReactIcon className="w-5 h-5" />} />
                        <TechStackBadge label="TypeScript" icon={<TypeScriptIcon className="w-5 h-5" />} />
                        <TechStackBadge label="Golang" icon={<GolangIcon className="w-5 h-5" />} />
                        <TechStackBadge label="Docker" icon={<DockerIcon className="w-5 h-5" />} />
                        <TechStackBadge label="Tailwind" icon={<TailwindIcon className="w-5 h-5" />} />
                    </div>
                </footer>
            </div>
        </div>
    )
}

type NavCardProps = {
    to: string
    title: string
    description: string
    icon: React.ReactNode
    color: string
    ring: string
    featured?: boolean
}

function TechStackBadge({ label, icon }: { label: string; icon: React.ReactNode }) {
    return (
        <div 
            role="img"
            aria-label={label}
            className="flex items-center gap-2 px-4 py-1 rounded-full bg-slate-800/30 text-slate-200 text-sm font-medium">
            <div 
                aria-hidden="true"
                className="fill-amber-300">
                {icon}
            </div>
            <span 
                aria-hidden="true"
                className="hidden sm:inline">{label}</span>
        </div>
    )
}

function NavCard({ to, title, description, icon, color, ring, featured = false }: NavCardProps) {
    return (
        <Link
            to={to}
            className={[
                "group relative rounded-2xl p-4 md:p-6",
                "bg-gradient-to-br", color,
                "backdrop-blur-sm",
                "shadow-xl hover:shadow-2xl",
                "ring-1 ring-inset", ring, "hover:ring-2",
                "transition-all duration-200 ease-out",
                "outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:offset-2",
                "flex items-center justify-between",
            ].join(" ")}
        >
            <div className="flex items-center gap-4">
                <div className={[
                    "flex items-center justify-center rounded-xl p-3",
                    featured ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/60" : "bg-slate-500/30 text-slate-100 ring-1 ring-slate-400/40",
                    "transition-colors",
                ].join(" ")}>
                    {icon}
                </div>
                <div className="text-left">
                    <h3 className={[
                        "text-lg md:text-xl font-semibold",
                        featured ? "text-amber-300" : "text-slate-100"
                    ].join(" ")}
                    >
                        {title}
                    </h3>
                    <p className="text-slate-300 text-xs">
                        {description}
                    </p>
                </div>
            </div>

            <div className={[
                "ml-4 shrink-0",
                featured ? "text-amber-300" : "text-slate-200",
                "transition-transform group-hover:translate-x-1"
            ].join(" ")}>
                <ChevronRight className="w-5 h-5" />
            </div>

            {featured && (
                <span
                    aria-hidden
                    className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-amber-400/0 via-amber-400/20 to-amber-400/0 opacity-0
group-hover:opacity-100 transition-opacity"
                />
            )}

            <span
                aria-hidden
                className={[
                    "absolute inset-0 rounded-2xl",
                    "transition-transform duration-200 ease-out",
                    "group-hover:scale-[1.02] active:scale-[0.995]"
                ].join(" ")}
            />
        </Link>
    )
}
