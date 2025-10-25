export interface IconContainerProps {
    className?: string
    children?: React.ReactNode
}

// Creates a wrapper container for SVG icons, it takes in SVG children <g>, <path>, etc.
export function IconContainer({className, children }: IconContainerProps) {
    return (
        <svg viewBox="0 0 128 128" className={className ? className : "w-full h-full"}>
            {children}
        </svg>
    )
}
