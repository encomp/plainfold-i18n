import { useTranslation } from 'react-i18next'
import { useCallback } from 'react'
import { Settings } from '@plainfold/store'
import type { PfLanguage } from './types'

const STORE_KEY = 'pf:i18n:locale'

export function useLocale(languages: PfLanguage[]) {
  const { i18n } = useTranslation()
  const locale = i18n.language

  const setLocale = useCallback(async (code: string) => {
    await i18n.changeLanguage(code)
    await Settings.set(STORE_KEY, code)
  }, [i18n])

  return { locale, setLocale, languages }
}
