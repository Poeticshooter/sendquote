import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceReturn {
  transcript: string
  interimTranscript: string
  listening: boolean
  supported: boolean
  error: string | null
  confidence: number
  start: () => void
  stop: () => void
  speak: (text: string, lang?: string) => void
  reset: () => void
}

export function useVoice(lang: string): UseVoiceReturn {
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const noSpeechCountRef = useRef(0)
  const isListeningRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      setSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = lang

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let final = ''
      let interim = ''
      let bestConfidence = 0
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const t = result[0].transcript
        if (result.isFinal) {
          final += t
          bestConfidence = Math.max(bestConfidence, result[0].confidence)
        } else {
          interim += t
        }
      }
      if (interim) {
        setInterimTranscript(interim)
      }
      if (final) {
        setTranscript(final.trim())
        setInterimTranscript('')
        setConfidence(bestConfidence)
        noSpeechCountRef.current = 0
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === 'no-speech') {
        noSpeechCountRef.current += 1
        if (noSpeechCountRef.current >= 3) {
          setListening(false)
          isListeningRef.current = false
          setError('I didn\'t hear anything. Tap the mic to try again.')
          noSpeechCountRef.current = 0
        }
      } else if (event.error === 'network') {
        setListening(false)
        isListeningRef.current = false
        setError('Voice requires internet. Check your connection.')
      } else if (event.error === 'not-allowed') {
        setListening(false)
        isListeningRef.current = false
        setError('Microphone access denied. Please allow microphone access.')
      } else {
        setListening(false)
        isListeningRef.current = false
        setError(`Speech error: ${event.error}`)
      }
    }

    recognition.onend = () => {
      if (isListeningRef.current) {
        try {
          recognition.start()
        } catch {
          setTimeout(() => {
            if (isListeningRef.current) {
              try { recognition.start() } catch { /* ignore */ }
            }
          }, 100)
        }
      } else {
        setListening(false)
      }
    }

    recognition.onstart = () => {
      setListening(true)
      setError(null)
      setConfidence(0)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.abort()
    }
  }, [lang])

  const start = useCallback(() => {
    if (!recognitionRef.current) return
    setTranscript('')
    setInterimTranscript('')
    setError(null)
    setConfidence(0)
    noSpeechCountRef.current = 0
    isListeningRef.current = true
    try {
      recognitionRef.current.start()
    } catch {
      recognitionRef.current.stop()
      setTimeout(() => {
        try { recognitionRef.current?.start() } catch { /* ignore */ }
      }, 100)
    }
  }, [])

  const stop = useCallback(() => {
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const speak = useCallback((text: string, speechLang?: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = speechLang || lang
    utterance.rate = 1.0
    utterance.pitch = 1.0

    const voices = window.speechSynthesis.getVoices()
    const matchingVoice = voices.find(v => v.lang.startsWith((speechLang || lang).slice(0, 2)))
    if (matchingVoice) {
      utterance.voice = matchingVoice
    }

    window.speechSynthesis.speak(utterance)
  }, [lang])

  const reset = useCallback(() => {
    setTranscript('')
    setInterimTranscript('')
    setConfidence(0)
  }, [])

  useEffect(() => {
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }
    window.speechSynthesis.onvoiceschanged = loadVoices
    loadVoices()

    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  return { transcript, interimTranscript, listening, supported, error, confidence, start, stop, speak, reset }
}
