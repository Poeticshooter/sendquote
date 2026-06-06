"use client";

import { createContext, useContext } from "react";

type Locale = "en" | "hi" | "mr";

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
}

const translations: Record<string, Record<string, string>> = {
  en: {
    "nav.signin": "Sign In",
    "nav.signup": "Get Started Free",
    "hero.title": "Close Deals Instantly. Not in Weeks.",
    "hero.subtitle": "AI generates quotes in 60 seconds. Buyers sign and pay in one click.",
    "cta.title": "Ready to Close Deals Faster?",
    "cta.subtitle": "Start free — no credit card required.",
    "cta.button": "Get Started Free",
    "footer.rights": "All rights reserved.",
  },
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  t: (key: string) => translations.en[key] || key,
});

export function I18nProvider({ children, locale = "en" }: { children: React.ReactNode; locale?: Locale }) {
  const t = (key: string) => translations[locale]?.[key] || translations.en[key] || key;
  return <I18nContext.Provider value={{ locale, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
