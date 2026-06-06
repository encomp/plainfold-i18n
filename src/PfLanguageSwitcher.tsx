import type { CSSProperties } from 'react'
import { useLocale } from './useLocale'
import type { PfLanguage } from './types'

interface PfLanguageSwitcherProps {
  languages: PfLanguage[]
  'data-testid'?: string
}

export function PfLanguageSwitcher({ languages, 'data-testid': testId }: PfLanguageSwitcherProps) {
  const { locale, setLocale } = useLocale(languages)

  const style: CSSProperties = {
    background: 'var(--pf-bg-surface-alt)',
    border: '1px solid var(--pf-border)',
    borderRadius: 'var(--pf-radius-sm)',
    color: 'var(--pf-text-primary)',
    fontFamily: 'var(--pf-font-ui)',
    fontSize: '14px',
    padding: '8px 12px',
    cursor: 'pointer',
    outline: 'none',
  }

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value)}
      style={style}
      data-testid={testId}
      aria-label="Language"
    >
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.label}
        </option>
      ))}
    </select>
  )
}
