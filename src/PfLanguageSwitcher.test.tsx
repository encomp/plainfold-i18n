import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { PfI18nProvider } from './PfI18nProvider'
import { PfLanguageSwitcher } from './PfLanguageSwitcher'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
  { code: 'fr', label: 'Francais' },
]

const RESOURCES = {
  en: { translation: { greeting: 'Hello' } },
  es: { translation: { greeting: 'Hola' } },
  fr: { translation: { greeting: 'Bonjour' } },
}

// Mock @plainfold/store
vi.mock('@plainfold/store', () => ({
  Settings: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue('ok'),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

function TestChild() {
  const { t } = useTranslation()
  return <span data-testid="greeting">{t('greeting')}</span>
}

describe('PfLanguageSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a select with all language options', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <PfLanguageSwitcher languages={LANGUAGES} data-testid="lang-select" />
      </PfI18nProvider>
    )

    await waitFor(() => {
      const select = screen.getByTestId('lang-select') as HTMLSelectElement
      expect(select).toBeInTheDocument()
      expect(select.tagName).toBe('SELECT')
    })

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(3)
    expect(options[0]).toHaveTextContent('English')
    expect(options[1]).toHaveTextContent('Espanol')
    expect(options[2]).toHaveTextContent('Francais')
  })

  it('has aria-label for accessibility', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <PfLanguageSwitcher languages={LANGUAGES} data-testid="lang-select" />
      </PfI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByLabelText('Language')).toBeInTheDocument()
    })
  })

  it('changes language when a new option is selected', async () => {
    const { Settings } = await import('@plainfold/store')

    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES} fallback="en">
        <PfLanguageSwitcher languages={LANGUAGES} data-testid="lang-select" />
        <TestChild />
      </PfI18nProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hello')
    })

    const user = userEvent.setup()
    await user.selectOptions(screen.getByTestId('lang-select'), 'es')

    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hola')
    })

    expect(Settings.set).toHaveBeenCalledWith('pf:i18n:locale', 'es')
  })

  it('reflects current locale as selected value', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES} fallback="en">
        <PfLanguageSwitcher languages={LANGUAGES} data-testid="lang-select" />
      </PfI18nProvider>
    )

    await waitFor(() => {
      const select = screen.getByTestId('lang-select') as HTMLSelectElement
      expect(select.value).toBe('en')
    })
  })
})
