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

/** How long to wait for the saved language before starting with the default (blocked site data can leave the read pending). */
export const STORAGE_READ_TIMEOUT_MS = 1500

/** Instances whose language the person has picked; a saved language arriving late never overrides these. */
export const pickedInstances = new WeakSet<I18nInstance>()

export function PfI18nProvider({ languages, resources, fallback = 'en', children }: PfI18nProviderProps) {
  const [ready, setReady] = useState(false)
  const instanceRef = useRef<I18nInstance | null>(null)

  useEffect(() => {
    const supportedCodes = languages.map(l => l.code)

    let started = false
    let cancelled = false
    let initDone: Promise<unknown> = Promise.resolve()
    // `read`: the stored language was read (possibly nothing stored). Only then is it safe to write the language back.
    const start = (savedLocale: string | undefined, read: boolean) => {
      if (started || cancelled) return
      started = true
      clearTimeout(timer)
      const instance = i18n.createInstance()
      instanceRef.current = instance

      initDone = instance
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
          // Blocked storage drops the save: the language lasts for this page only.
          if (read) Promise.resolve().then(() => Settings.set(STORE_KEY, instance.language)).catch(() => {})
          if (!cancelled) setReady(true)
        })
    }

    // A read that fails, throws or never settles starts with the default language (and writes nothing back).
    const timer = setTimeout(() => start(undefined, false), STORAGE_READ_TIMEOUT_MS)
    Promise.resolve()
      .then(() => Settings.get<string>(STORE_KEY))
      .then(
        (saved) => {
          if (!started) return start(saved, true)
          // A saved language arriving after the timeout still wins, unless the person has picked one since.
          const instance = instanceRef.current
          if (!saved || !instance) return
          void initDone.then(() => {
            if (!cancelled && !pickedInstances.has(instance) && saved !== instance.language) void instance.changeLanguage(saved)
          })
        },
        () => start(undefined, false),
      )
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ready || !instanceRef.current) return null

  return <I18nextProvider i18n={instanceRef.current}>{children}</I18nextProvider>
}
