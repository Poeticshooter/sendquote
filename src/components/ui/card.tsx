interface CardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
  padding?: "none" | "sm" | "md" | "lg"
}

const paddingClasses: Record<string, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
}

export default function Card({
  children,
  className = "",
  hover = false,
  padding = "md",
}: CardProps) {
  const baseClasses = [
    "bg-white rounded-xl border border-slate-100 shadow-sm",
    paddingClasses[padding],
    hover && "hover:shadow-lg hover:border-indigo-100 transition-all duration-300",
    className,
  ].filter(Boolean).join(" ")

  return <div className={baseClasses}>{children}</div>
}
