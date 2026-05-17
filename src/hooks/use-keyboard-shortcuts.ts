"use client"

import { useEffect, useRef } from "react"

type ShortcutHandler = {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  handler: () => void
  preventDefault?: boolean
}

export function useKeyboardShortcuts(shortcuts: ShortcutHandler[]) {
  const shortcutsRef = useRef(shortcuts)

  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      for (const shortcut of shortcutsRef.current) {
        const matchKey = e.key.toLowerCase() === shortcut.key.toLowerCase()
        const matchCtrl = !!shortcut.ctrl === (e.ctrlKey || e.metaKey)
        const matchShift = !!shortcut.shift === e.shiftKey
        const matchAlt = !!shortcut.alt === e.altKey

        if (matchKey && matchCtrl && matchShift && matchAlt) {
          if (shortcut.preventDefault !== false) e.preventDefault()
          shortcut.handler()
          return
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])
}
