"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"
import en from "@/locales/en.json"
import hi from "@/locales/hi.json"

const dictionaries: Record<string, Record<string, string>> = {
  en,
  hi,
}

type I18nContextType = {
  t: (key: string) => string
  language: string
  setLanguage: (lang: string) => void
}

const I18nContext = createContext<I18nContextType>({
  t: (key: string) => key,
  language: "en",
  setLanguage: () => {},
})

export function useTranslation() {
  return useContext(I18nContext)
}

export function I18nProvider({ children, initialLanguage = "en" }: { children: React.ReactNode; initialLanguage?: string }) {
  const [language, setLanguage] = useState(initialLanguage)
  const [dict, setDict] = useState(dictionaries[initialLanguage] || dictionaries.en)

  const t = useCallback(
    (key: string) => {
      return dict[key] || key
    },
    [dict]
  )

  useEffect(() => {
    const newDict = dictionaries[language] || dictionaries.en
    setDict(newDict)
  }, [language])

  return (
    <I18nContext.Provider value={{ t, language, setLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}
