import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Settings } from '@plainfold/store'
import { PfI18nProvider, STORAGE_READ_TIMEOUT_MS } from './PfI18nProvider'
import { useLocale } from './useLocale'
import { useTranslation } from 'react-i18next'

vi.mock('@plainfold/store', () => ({
  Settings: { get: vi.fn(), set: vi.fn().mockResolvedValue(undefined), remove: vi.fn() },
}))

const L = [{ code: 'en', label: 'English' }]
const R = { en: { translation: {} } }
vi.mocked(Settings.get).mockResolvedValue(undefined)
function T() {
  const { i18n } = useTranslation()
  return <p data-testid="lang">{i18n.language}</p>
}
const mount = () => render(<PfI18nProvider languages={L} resources={R}><p>hello</p></PfI18nProvider>)

afterEach(() => {
  vi.mocked(Settings.get).mockReset().mockResolvedValue(undefined)
  vi.mocked(Settings.set).mockReset().mockResolvedValue(undefined)
  vi.useRealTimers()
})

describe('PfI18nProvider with site data blocked', () => {
  it('renders children when the store read rejects', async () => {
    vi.mocked(Settings.get).mockRejectedValue(new Error('SecurityError'))
    mount()
    expect(await screen.findByText('hello')).toBeInTheDocument()
  })

  it('renders children when the store read throws', async () => {
    vi.mocked(Settings.get).mockImplementation(() => { throw new Error('SecurityError') })
    mount()
    expect(await screen.findByText('hello')).toBeInTheDocument()
  })

  it('renders children when the save rejects', async () => {
    vi.mocked(Settings.set).mockRejectedValue(new Error('SecurityError'))
    mount()
    expect(await screen.findByText('hello')).toBeInTheDocument()
  })

  it('renders children when the read never settles', async () => {
    vi.useFakeTimers()
    vi.mocked(Settings.get).mockReturnValue(new Promise(() => {}))
    mount()
    expect(screen.queryByText('hello')).toBeNull()
    await act(async () => { await vi.advanceTimersByTimeAsync(STORAGE_READ_TIMEOUT_MS) })
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('a saved language arriving after the timeout wins and no default is written', async () => {
    vi.useFakeTimers()
    let late: (v: string) => void = () => {}
    vi.mocked(Settings.get).mockReturnValue(new Promise<string>((r) => { late = r }))
    render(<PfI18nProvider languages={[...L, { code: 'es', label: 'Espanol' }]} resources={{ ...R, es: { translation: { g: 'Hola' } } }}><T /></PfI18nProvider>)
    await act(async () => { await vi.advanceTimersByTimeAsync(STORAGE_READ_TIMEOUT_MS) })
    expect(screen.getByTestId('lang')).toHaveTextContent('en')
    await act(async () => { late('es'); await vi.advanceTimersByTimeAsync(10) })
    expect(screen.getByTestId('lang')).toHaveTextContent('es')
    expect(Settings.set).not.toHaveBeenCalled()
  })

  it('setLocale changes the language and drops a rejected save', async () => {
    vi.mocked(Settings.set).mockRejectedValue(new Error('SecurityError'))
    let pick: (c: string) => Promise<void> = async () => {}
    function P() {
      pick = useLocale(L).setLocale
      return <T />
    }
    render(<PfI18nProvider languages={[...L, { code: 'es', label: 'Espanol' }]} resources={{ ...R, es: { translation: { g: 'Hola' } } }}><P /></PfI18nProvider>)
    await screen.findByTestId('lang')
    await act(async () => { await pick('es') })
    expect(screen.getByTestId('lang')).toHaveTextContent('es')
  })

  it('a pick that equals the default, made before the late read lands, is not overridden', async () => {
    vi.useFakeTimers()
    let late: (v: string) => void = () => {}
    vi.mocked(Settings.get).mockReturnValue(new Promise<string>((r) => { late = r }))
    let pick: (c: string) => Promise<void> = async () => {}
    function P() {
      pick = useLocale(L).setLocale
      return <T />
    }
    render(<PfI18nProvider languages={[...L, { code: 'es', label: 'Espanol' }]} resources={{ ...R, es: { translation: { g: 'Hola' } } }}><P /></PfI18nProvider>)
    await act(async () => { await vi.advanceTimersByTimeAsync(STORAGE_READ_TIMEOUT_MS) })
    const start = screen.getByTestId('lang').textContent ?? ''
    await act(async () => { await pick(start) }) // exactly the language shown at start (e.g. en-US)
    await act(async () => { late('es'); await vi.advanceTimersByTimeAsync(10) })
    expect(screen.getByTestId('lang')).toHaveTextContent(start)
  })
})
