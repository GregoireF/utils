import { describe, expect, expectTypeOf, it, vi } from 'vitest'
import {
  type LogEntry,
  type Logger,
  type Transport,
  consoleTransport,
  createLogger,
} from '../src/logger.js'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function captureTransport(): { entries: LogEntry[]; transport: Transport } {
  const entries: LogEntry[] = []
  return { entries, transport: (entry) => entries.push(entry) }
}

// ─── createLogger() ───────────────────────────────────────────────────────────

describe('createLogger()', () => {
  it('emits a log entry with correct level and message', () => {
    const { entries, transport } = captureTransport()
    const logger = createLogger({ transports: [transport] })
    logger.info('hello')
    expect(entries).toHaveLength(1)
    expect(entries[0]?.level).toBe('info')
    expect(entries[0]?.message).toBe('hello')
  })

  it('includes an ISO timestamp on every entry', () => {
    const { entries, transport } = captureTransport()
    createLogger({ transports: [transport] }).info('ts')
    expect(entries[0]?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })

  it('merges per-call context into the log entry', () => {
    const { entries, transport } = captureTransport()
    createLogger({ transports: [transport] }).info('req', { method: 'GET', path: '/' })
    expect(entries[0]?.['method']).toBe('GET')
    expect(entries[0]?.['path']).toBe('/')
  })

  it('emits for all four log levels', () => {
    const { entries, transport } = captureTransport()
    const logger = createLogger({ transports: [transport] })
    logger.debug('d')
    logger.info('i')
    logger.warn('w')
    logger.error('e')
    expect(entries.map((e) => e.level)).toEqual(['debug', 'info', 'warn', 'error'])
  })

  it('defaults to debug level — logs everything', () => {
    const { entries, transport } = captureTransport()
    createLogger({ transports: [transport] }).debug('verbose')
    expect(entries).toHaveLength(1)
  })

  it('suppresses entries below the configured min level', () => {
    const { entries, transport } = captureTransport()
    const logger = createLogger({ level: 'warn', transports: [transport] })
    logger.debug('skip')
    logger.info('skip')
    logger.warn('keep')
    logger.error('keep')
    expect(entries).toHaveLength(2)
    expect(entries.map((e) => e.level)).toEqual(['warn', 'error'])
  })

  it('sends the entry to every registered transport', () => {
    const a = captureTransport()
    const b = captureTransport()
    createLogger({ transports: [a.transport, b.transport] }).info('broadcast')
    expect(a.entries).toHaveLength(1)
    expect(b.entries).toHaveLength(1)
  })

  it('spreads base context into every entry', () => {
    const { entries, transport } = captureTransport()
    createLogger({ context: { service: 'api' }, transports: [transport] }).info('started')
    expect(entries[0]?.['service']).toBe('api')
  })

  it('per-call context overrides base context', () => {
    const { entries, transport } = captureTransport()
    createLogger({ context: { reqId: 'base' }, transports: [transport] }).info('req', {
      reqId: 'override',
    })
    expect(entries[0]?.['reqId']).toBe('override')
  })

  it('works with no options — uses console transport', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    expect(() => createLogger().info('ok')).not.toThrow()
    spy.mockRestore()
  })

  it('infers Logger interface', () => {
    expectTypeOf(createLogger()).toMatchTypeOf<Logger>()
  })
})

// ─── child() ─────────────────────────────────────────────────────────────────

describe('child logger', () => {
  it('inherits parent level and transports', () => {
    const { entries, transport } = captureTransport()
    const child = createLogger({ level: 'warn', transports: [transport] }).child({
      component: 'db',
    })
    child.info('skip')
    child.warn('keep')
    expect(entries).toHaveLength(1)
    expect(entries[0]?.level).toBe('warn')
  })

  it('merges child context with parent context', () => {
    const { entries, transport } = captureTransport()
    const child = createLogger({ context: { service: 'api' }, transports: [transport] }).child({
      component: 'db',
    })
    child.info('query')
    expect(entries[0]?.['service']).toBe('api')
    expect(entries[0]?.['component']).toBe('db')
  })

  it('child context takes precedence over parent context', () => {
    const { entries, transport } = captureTransport()
    const child = createLogger({ context: { env: 'parent' }, transports: [transport] }).child({
      env: 'child',
    })
    child.info('test')
    expect(entries[0]?.['env']).toBe('child')
  })

  it('returns a Logger interface', () => {
    expectTypeOf(createLogger().child({})).toMatchTypeOf<Logger>()
  })
})

// ─── consoleTransport ─────────────────────────────────────────────────────────

describe('consoleTransport', () => {
  it('calls console.debug for debug entries', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleTransport({ level: 'debug', message: 'x', timestamp: 't' })
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('calls console.info for info entries', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleTransport({ level: 'info', message: 'x', timestamp: 't' })
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('calls console.warn for warn entries', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleTransport({ level: 'warn', message: 'x', timestamp: 't' })
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('calls console.error for error entries', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleTransport({ level: 'error', message: 'x', timestamp: 't' })
    expect(spy).toHaveBeenCalledOnce()
    spy.mockRestore()
  })

  it('outputs valid JSON', () => {
    let output = ''
    const spy = vi.spyOn(console, 'info').mockImplementation((msg: string) => {
      output = msg
    })
    consoleTransport({ level: 'info', message: 'test', timestamp: '2026-01-01T00:00:00.000Z' })
    expect(() => JSON.parse(output)).not.toThrow()
    const parsed = JSON.parse(output) as LogEntry
    expect(parsed.level).toBe('info')
    expect(parsed.message).toBe('test')
    spy.mockRestore()
  })
})
