import Link from "next/link"

export default function BrandLogo({ className = "h-7", href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={`${className} flex items-center gap-2 shrink-0`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <rect width="32" height="32" rx="8" fill="#4F46E5" />
        <path
          d="M10 10h12M10 16h8M10 22h10"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M22 18l4 4-4 4"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
        SendQuote
      </span>
    </Link>
  )
}
