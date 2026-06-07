"use client";

import { createContext, useContext } from "react";

export type Locale = "en" | "hi" | "mr";

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
    "hero.cta": "Get Started Free",
    "hero.learn": "See How It Works",
    "how.title": "How It Works",
    "how.step1": "Describe your project in plain text — AI builds a professional quote instantly.",
    "how.step2": "Share a secure link. Buyers view, negotiate, and chat in a branded deal room.",
    "how.step3": "Buyers sign, pay, and you get notified — all in one place.",
    "features.title": "Everything You Need to Close Deals",
    "features.ai": "AI Quote Generation",
    "features.ai.desc": "Generate complete quotes from a single sentence in under 60 seconds.",
    "features.dealroom": "Interactive Deal Rooms",
    "features.dealroom.desc": "Branded quote pages with real-time buyer tracking and built-in chat.",
    "features.payment": "Payments & E-Sign",
    "features.payment.desc": "Collect signatures and payments — credit cards, UPI, bank transfer.",
    "features.crm": "CRM Sync",
    "features.crm.desc": "Bi-directional sync with HubSpot, Salesforce, and Pipedrive.",
    "pricing.title": "Simple Pricing",
    "pricing.starter": "Starter",
    "pricing.pro": "Professional",
    "pricing.enterprise": "Enterprise",
    "cta.title": "Ready to Close Deals Faster?",
    "cta.subtitle": "Start free — no credit card required.",
    "cta.button": "Get Started Free",
    "footer.rights": "All rights reserved.",
  },
  hi: {
    "nav.signin": "साइन इन",
    "nav.signup": "मुफ्त शुरू करें",
    "hero.title": "डील्स को तुरंत बंद करें। हफ्तों में नहीं।",
    "hero.subtitle": "AI 60 सेकंड में कोट्स जनरेट करता है। खरीदार एक क्लिक में साइन और भुगतान करते हैं।",
    "hero.cta": "मुफ्त शुरू करें",
    "hero.learn": "यह कैसे काम करता है",
    "how.title": "यह कैसे काम करता है",
    "how.step1": "अपने प्रोजेक्ट को सादे टेक्स्ट में बताएं — AI तुरंत एक प्रोफेशनल कोट बनाता है।",
    "how.step2": "एक सुरक्षित लिंक साझा करें। खरीदार ब्रांडेड डील रूम में देखते, बातचीत करते और चैट करते हैं।",
    "how.step3": "खरीदार साइन करते हैं, भुगतान करते हैं, और आपको सूचना मिलती है — सब एक जगह।",
    "features.title": "डील बंद करने के लिए वह सब कुछ जो आपको चाहिए",
    "features.ai": "AI कोट जनरेशन",
    "features.ai.desc": "एक वाक्य से 60 सेकंड में पूरा कोट जनरेट करें।",
    "features.dealroom": "इंटरैक्टिव डील रूम",
    "features.dealroom.desc": "ब्रांडेड कोट पेज जिसमें रियल-टाइम बायर ट्रैकिंग और बिल्ट-इन चैट।",
    "features.payment": "भुगतान और ई-साइन",
    "features.payment.desc": "हस्ताक्षर और भुगतान लें — क्रेडिट कार्ड, UPI, बैंक ट्रांसफर।",
    "features.crm": "CRM सिंक",
    "features.crm.desc": "HubSpot, Salesforce और Pipedrive के साथ दो-तरफा सिंक।",
    "pricing.title": "सरल मूल्य निर्धारण",
    "pricing.starter": "स्टार्टर",
    "pricing.pro": "प्रोफेशनल",
    "pricing.enterprise": "एंटरप्राइज",
    "cta.title": "तेजी से डील बंद करने के लिए तैयार हैं?",
    "cta.subtitle": "मुफ्त शुरू करें — कोई क्रेडिट कार्ड आवश्यक नहीं।",
    "cta.button": "मुफ्त शुरू करें",
    "footer.rights": "सर्वाधिकार सुरक्षित।",
  },
  mr: {
    "nav.signin": "साइन इन",
    "nav.signup": "विनामूल्य सुरू करा",
    "hero.title": "डील्स लगेच बंद करा. आठवड्यात नाही.",
    "hero.subtitle": "AI ६० सेकंदात कोट तयार करतो. खरेदीदार एका क्लिकवर साइन आणि पैसे भरतात.",
    "hero.cta": "विनामूल्य सुरू करा",
    "hero.learn": "हे कसे काम करते",
    "how.title": "हे कसे काम करते",
    "how.step1": "तुमचा प्रोजेक्ट साध्या मजकुरात सांगा — AI लगेच व्यावसायिक कोट तयार करतो.",
    "how.step2": "सुरक्षित लिंक शेअर करा. खरेदीदार ब्रँडेड डील रूममध्ये पाहतात, बोलणी करतात आणि चॅट करतात.",
    "how.step3": "खरेदीदार साइन करतात, पैसे भरतात, आणि तुम्हाला सूचना मिळते — सगळं एकाच ठिकाणी.",
    "features.title": "डील बंद करण्यासाठी लागणारी प्रत्येक गोष्ट",
    "features.ai": "AI कोट जनरेशन",
    "features.ai.desc": "एक वाक्यातून ६० सेकंदात पूर्ण कोट तयार करा.",
    "features.dealroom": "इंटरअॅक्टिव्ह डील रूम",
    "features.dealroom.desc": "रिअल-टाइम खरेदीदार ट्रॅकिंग आणि बिल्ट-इन चॅटसह ब्रँडेड कोट पेज.",
    "features.payment": "पेमेंट आणि ई-साइन",
    "features.payment.desc": "स्वाक्षरी आणि पेमेंट घ्या — क्रेडिट कार्ड, UPI, बँक ट्रान्सफर.",
    "features.crm": "CRM सिंक",
    "features.crm.desc": "HubSpot, Salesforce आणि Pipedrive सह द्वि-दिशात्मक सिंक.",
    "pricing.title": "सोपी किंमत",
    "pricing.starter": "स्टार्टर",
    "pricing.pro": "प्रोफेशनल",
    "pricing.enterprise": "एंटरप्राइज",
    "cta.title": "जलद डील बंद करायला तयार आहात?",
    "cta.subtitle": "विनामूल्य सुरू करा — कोणतेही क्रेडिट कार्ड आवश्यक नाही.",
    "cta.button": "विनामूल्य सुरू करा",
    "footer.rights": "सर्व हक्क राखीव.",
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
