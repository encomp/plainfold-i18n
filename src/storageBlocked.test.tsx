import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { Settings } from '@plainfold/store'
import { PfI18nProvider, STORAGE_READ_TIMEOUT_MS } from './PfI18nProvider'

vi.mock('@plainfold/store', () => ({
  Settings: { get: vi.fn(), set: vi.fn().mockResolvedValue(undefined), remove: vi.fn() },
}))

const L = [{ code: 'en', label: 'English' }]
const R = { en: { translation: {} } }
vi.mocked(Settings.get).mockResolvedValue(undefined)
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
})
