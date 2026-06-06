import { useEffect, useState, useRef, type ReactNode } from 'react'
import i18n, { type i18n as I18nInstance } from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { Settings } from '@plainfold/store'
import type { PfLanguage } from './types'

interface PfI18nProviderProps {
  languages: PfLanguage[]
  resources: Record<string, { translation: Record<string, unknown> }>
  fallback?: string
  children: ReactNode
}

const STORE_KEY = 'pf:i18n:locale'

export function PfI18nProvider({ languages, resources, fallback = 'en', children }: PfI18nProviderProps) {
  const [ready, setReady] = useState(false)
  const instanceRef = useRef<I18nInstance | null>(null)

  useEffect(() => {
    const supportedCodes = languages.map(l => l.code)

    Settings.get<string>(STORE_KEY).then((savedLocale) => {
      const instance = i18n.createInstance()
      instanceRef.current = instance

      instance
        .use(LanguageDetector)
        .use(initReactI18next)
        .init({
          resources,
          load: 'languageOnly',
          fallbackLng: fallback,
          supportedLngs: supportedCodes,
          lng: savedLocale || undefined,
          interpolation: { escapeValue: false },
          detection: {
            order: ['querystring', 'navigator', 'htmlTag'],
            caches: [],
          },
        })
        .then(() => {
          Settings.set(STORE_KEY, instance.language)
          setReady(true)
        })
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !instanceRef.current) return null

  return <I18nextProvider i18n={instanceRef.current}>{children}</I18nextProvider>
}
