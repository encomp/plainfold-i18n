import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useTranslation } from 'react-i18next'
import { PfI18nProvider } from './PfI18nProvider'
import { useLocale } from './useLocale'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
]

const RESOURCES = {
  en: { translation: { greeting: 'Hello' } },
  es: { translation: { greeting: 'Hola' } },
}

// Mock @plainfold/store
vi.mock('@plainfold/store', () => ({
  Settings: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue('ok'),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

function TestLocaleDisplay() {
  const { locale, setLocale, languages } = useLocale(LANGUAGES)
  const { t } = useTranslation()
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="greeting">{t('greeting')}</span>
      <span data-testid="lang-count">{languages.length}</span>
      <button data-testid="switch-es" onClick={() => setLocale('es')}>Switch to ES</button>
      <button data-testid="switch-en" onClick={() => setLocale('en')}>Switch to EN</button>
    </div>
  )
}

describe('useLocale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns current locale', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES} fallback="en">
        <TestLocaleDisplay />
      </PfI18nProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en')
    })
  })

  it('returns languages array', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <TestLocaleDisplay />
      </PfI18nProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('lang-count')).toHaveTextContent('2')
    })
  })

  it('setLocale changes language and persists to store', async () => {
    const { Settings } = await import('@plainfold/store')

    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES} fallback="en">
        <TestLocaleDisplay />
      </PfI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hello')
    })

    const user = userEvent.setup()
    await user.click(screen.getByTestId('switch-es'))

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hola')
      expect(screen.getByTestId('locale')).toHaveTextContent('es')
    })

    expect(Settings.set).toHaveBeenCalledWith('pf:i18n:locale', 'es')
  })
})
