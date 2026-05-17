import { useRef, useEffect } from "react"
import { motion, useScroll, useTransform, useInView, useMotionValue, animate as framerAnimate } from "framer-motion"

export function FloatingOrb({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 8,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  )
}

export function Floating3DCube({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={{ perspective: "1000px" }}
      animate={{
        rotateY: [0, 360],
        rotateX: [0, -20],
        y: [0, -20, 0],
      }}
      transition={{
        duration: 20,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl shadow-2xl shadow-indigo-500/30"
        style={{ transform: "rotateY(45deg) rotateX(30deg)" }} />
    </motion.div>
  )
}

export function FloatingDocument({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -25, 0],
        rotate: [-5, 5, -5],
        scale: [1, 1.05, 1],
      }}
      transition={{
        duration: 6,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-12 h-16 bg-white rounded-lg shadow-xl border border-slate-200 flex flex-col p-2 gap-1">
        <div className="h-1 bg-slate-200 rounded" />
        <div className="h-1 bg-slate-200 rounded w-3/4" />
        <div className="h-1 bg-slate-200 rounded w-1/2" />
        <div className="mt-auto h-2 bg-indigo-500 rounded" />
      </div>
    </motion.div>
  )
}

export function FloatingCoin({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -15, 0],
        rotateY: [0, 180, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 5,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full shadow-lg shadow-amber-500/30 flex items-center justify-center">
        <span className="text-amber-900 font-bold text-lg">₹</span>
      </div>
    </motion.div>
  )
}

export function FloatingCheck({ className, delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.div
      className={`absolute ${className}`}
      animate={{
        y: [0, -20, 0],
        scale: [1, 1.1, 1],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div className="w-12 h-12 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center">
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    </motion.div>
  )
}

export function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-60px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function ScaleIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-40px" })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.34, 1.56, 0.64, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true })
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest))

  useEffect(() => {
    if (isInView) {
      const controls = framerAnimate(0, target, {
        duration: 1.5,
        ease: "easeOut",
        onUpdate: (latest) => count.set(latest),
      })
      return () => controls.stop()
    }
  }, [isInView, target, count])

  return (
    <span ref={ref}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  )
}
