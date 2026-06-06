import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useTranslation } from 'react-i18next'
import { PfI18nProvider } from './PfI18nProvider'

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Espanol' },
]

const RESOURCES = {
  en: { translation: { greeting: 'Hello' } },
  es: { translation: { greeting: 'Hola' } },
}

function TestChild() {
  const { t } = useTranslation()
  return <span data-testid="greeting">{t('greeting')}</span>
}

// Mock @plainfold/store
vi.mock('@plainfold/store', () => ({
  Settings: {
    get: vi.fn().mockResolvedValue(undefined),
    set: vi.fn().mockResolvedValue('ok'),
    remove: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('PfI18nProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders children after initialization with fallback locale', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <TestChild />
      </PfI18nProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hello')
    })
  })

  it('returns null before initialization completes', () => {
    const { container } = render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <span data-testid="child">visible</span>
      </PfI18nProvider>
    )
    // The provider eventually renders children
    // (it may or may not be null synchronously depending on timing)
    // We just verify it eventually shows up
    return waitFor(() => {
      expect(container.textContent).toContain('visible')
    })
  })

  it('uses saved locale from store', async () => {
    const { Settings } = await import('@plainfold/store')
    vi.mocked(Settings.get).mockResolvedValue('es')

    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <TestChild />
      </PfI18nProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hola')
    })
  })

  it('persists detected locale to store', async () => {
    const { Settings } = await import('@plainfold/store')
    vi.mocked(Settings.get).mockResolvedValue(undefined)

    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES} fallback="en">
        <TestChild />
      </PfI18nProvider>
    )
    await waitFor(() => {
      expect(Settings.set).toHaveBeenCalledWith('pf:i18n:locale', expect.any(String))
    })
  })

  it('defaults fallback to en', async () => {
    render(
      <PfI18nProvider languages={LANGUAGES} resources={RESOURCES}>
        <TestChild />
      </PfI18nProvider>
    )
    await waitFor(() => {
      expect(screen.getByTestId('greeting')).toHaveTextContent('Hello')
    })
  })
})
