"use client"

import { createContext, useContext, useState, useCallback, useRef } from "react"

type ToastType = "success" | "error" | "info" | "warning" | "undo"

type Toast = {
  id: number
  message: string
  type: ToastType
  onUndo?: () => void
  duration: number
}

type ToastContextType = {
  toast: (message: string, type?: ToastType, duration?: number) => void
  toastWithUndo: (message: string, onUndo: () => void, duration?: number) => void
}

const ToastContext = createContext<ToastContextType>({ toast: () => {}, toastWithUndo: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const MAX_TOASTS = 3

const typeIcons: Record<ToastType, React.ReactNode> = {
  success: (
    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  warning: (
    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
  undo: (
    <svg className="w-4 h-4 text-white shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  ),
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-slate-800 text-white",
  undo: "bg-slate-800 text-white",
}

const progressColors: Record<ToastType, string> = {
  success: "bg-emerald-400",
  error: "bg-red-300",
  warning: "bg-amber-300",
  info: "bg-indigo-400",
  undo: "bg-indigo-400",
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const idCounter = useRef(0)

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const toast = useCallback((message: string, type: ToastType = "info", duration = 3500) => {
    const id = ++idCounter.current
    setToasts(prev => {
      const next = [...prev, { id, message, type, duration }]
      return next.slice(-MAX_TOASTS)
    })
    const timer = setTimeout(() => removeToast(id), duration)
    timersRef.current.set(id, timer)
  }, [removeToast])

  const toastWithUndo = useCallback((message: string, onUndo: () => void, duration = 5000) => {
    const id = ++idCounter.current
    setToasts(prev => {
      const next = [...prev, { id, message, type: "undo" as ToastType, onUndo, duration }]
      return next.slice(-MAX_TOASTS)
    })
    const timer = setTimeout(() => removeToast(id), duration)
    timersRef.current.set(id, timer)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ toast, toastWithUndo }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm sm:block hidden"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-slide-up px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2.5 relative overflow-hidden ${typeStyles[t.type]}`}
          >
            {typeIcons[t.type]}
            <span className="flex-1">{t.message}</span>
            {t.type === "undo" && t.onUndo && (
              <button
                onClick={() => { t.onUndo?.(); removeToast(t.id) }}
                className="text-indigo-300 hover:text-white font-semibold text-xs underline transition-colors shrink-0"
              >
                Undo
              </button>
            )}
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${progressColors[t.type]} transition-all ease-linear`}
              style={{ width: "100%", animation: `shrink ${t.duration}ms linear forwards` }}
            />
          </div>
        ))}
      </div>
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-sm w-full px-4 sm:hidden"
        role="status"
        aria-live="polite"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className={`animate-slide-up px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2.5 relative overflow-hidden ${typeStyles[t.type]}`}
          >
            {typeIcons[t.type]}
            <span className="flex-1">{t.message}</span>
            {t.type === "undo" && t.onUndo && (
              <button
                onClick={() => { t.onUndo?.(); removeToast(t.id) }}
                className="text-indigo-300 hover:text-white font-semibold text-xs underline transition-colors shrink-0"
              >
                Undo
              </button>
            )}
            <div
              className={`absolute bottom-0 left-0 h-0.5 ${progressColors[t.type]} transition-all ease-linear`}
              style={{ width: "100%", animation: `shrink ${t.duration}ms linear forwards` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
