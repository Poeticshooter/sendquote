"use client"

import { forwardRef } from "react"
import { motion, HTMLMotionProps } from "framer-motion"

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success"
type ButtonSize = "sm" | "md" | "lg" | "icon"

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "disabled"> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  disabled?: boolean
  as?: "button" | "a"
  href?: string
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-sm hover:shadow-md",
  secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:bg-slate-100",
  ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200",
  danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm hover:shadow-md",
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-lg",
  lg: "px-6 py-3 text-base rounded-xl",
  icon: "p-2 rounded-lg",
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      disabled = false,
      as = "button",
      href,
      className = "",
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      "inline-flex items-center justify-center gap-2 font-medium",
      "transition-all duration-200",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      variantStyles[variant],
      sizeStyles[size],
      fullWidth ? "w-full" : "",
      className,
    ].filter(Boolean).join(" ")

    const MotionComponent = motion.button

    if (loading) {
      return (
        <MotionComponent
          ref={ref as React.Ref<HTMLButtonElement>}
          className={baseClasses}
          disabled={true}
          whileTap={{ scale: 0.98 }}
          {...(props as React.ComponentProps<typeof MotionComponent>)}
        >
          <svg
            className="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </MotionComponent>
      )
    }

    if (as === "a" && href) {
      return (
        <motion.a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={baseClasses}
          whileTap={{ scale: 0.98 }}
          {...(props as React.ComponentProps<typeof motion.a>)}
        >
          {children}
        </motion.a>
      )
    }

    return (
      <MotionComponent
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClasses}
        disabled={disabled}
        whileTap={{ scale: 0.98 }}
        {...(props as React.ComponentProps<typeof MotionComponent>)}
      >
        {children}
      </MotionComponent>
    )
  }
)

Button.displayName = "Button"

export default Button
