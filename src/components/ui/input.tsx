"use client"

import { forwardRef, useId } from "react"

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string
  error?: string
  helper?: string
  icon?: React.ReactNode
  inputSize?: "sm" | "md" | "lg"
}

const sizeClasses: Record<string, string> = {
  sm: "py-1.5 text-sm",
  md: "py-2.5 text-sm",
  lg: "py-3 text-base",
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helper, icon, inputSize = "md", className = "", id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId
    const errorId = `${inputId}-error`
    const helperId = `${inputId}-helper`

    const inputClasses = [
      "w-full border rounded-lg transition-all duration-200",
      "bg-white text-slate-900",
      "placeholder:text-slate-400",
      "focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400",
      error
        ? "border-red-300 focus:border-red-400 focus:ring-red-200"
        : "border-slate-200",
      icon ? "pl-10" : "px-3.5",
      sizeClasses[inputSize],
      className,
    ].filter(Boolean).join(" ")

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helper ? helperId : undefined}
            {...props}
          />
        </div>
        {error && (
          <p id={errorId} className="text-xs text-red-600 mt-1" role="alert">
            {error}
          </p>
        )}
        {!error && helper && (
          <p id={helperId} className="text-xs text-slate-500 mt-1">
            {helper}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = "Input"

export default Input
