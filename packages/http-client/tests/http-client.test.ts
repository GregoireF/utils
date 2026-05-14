import { isErr, isOk } from '@gregoiref/result'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HttpError, TimeoutError, createHttpClient } from '../src/http-client.js'

// ─── Fetch mock helpers ───────────────────────────────────────────────────────

function mockFetch(response: Response): void {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response))
}

function makeResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = { 'content-type': 'application/json' },
): Response {
  return new Response(JSON.stringify(body), { status, headers })
}

function makeTextResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/plain' } })
}

// ─── createHttpClient() ───────────────────────────────────────────────────────

describe('createHttpClient()', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('URL and headers', () => {
    it('performs a GET request to the given URL', async () => {
      mockFetch(makeResponse({ ok: true }))
      const client = createHttpClient()
      const result = await client.get<{ ok: boolean }>('/users')
      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(vi.mocked(fetch)).toHaveBeenCalledWith(
          '/users',
          expect.objectContaining({ method: 'GET' }),
        )
        expect(result.value.data.ok).toBe(true)
      }
    })

    it('prepends baseUrl to every request', async () => {
      mockFetch(makeResponse({ id: 1 }))
      const client = createHttpClient({ baseUrl: 'https://api.example.com' })
      await client.get('/users/1')
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        'https://api.example.com/users/1',
        expect.anything(),
      )
    })

    it('merges defaultHeaders with per-request headers', async () => {
      mockFetch(makeResponse({}))
      const client = createHttpClient({ defaultHeaders: { Authorization: 'Bearer token' } })
      await client.get('/', { headers: { 'X-Req-ID': '123' } })
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      const headers = init?.headers as Record<string, string>
      expect(headers['Authorization']).toBe('Bearer token')
      expect(headers['X-Req-ID']).toBe('123')
    })

    it('returns status and headers on success', async () => {
      mockFetch(
        makeResponse({ done: true }, 201, { 'content-type': 'application/json', 'x-id': '42' }),
      )
      const client = createHttpClient()
      const result = await client.post<{ done: boolean }>('/')
      expect(isOk(result)).toBe(true)
      if (isOk(result)) {
        expect(result.value.status).toBe(201)
        expect(result.value.headers['x-id']).toBe('42')
      }
    })
  })

  describe('method shorthands', () => {
    it('post sends body as JSON', async () => {
      mockFetch(makeResponse({ created: true }))
      const client = createHttpClient()
      await client.post('/items', { name: 'test' })
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      expect(init?.body).toBe('{"name":"test"}')
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    })

    it('put sends body as JSON', async () => {
      mockFetch(makeResponse({}))
      const client = createHttpClient()
      await client.put('/items/1', { name: 'updated' })
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      expect(init?.body).toBe('{"name":"updated"}')
      expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
    })

    it('patch sends body as JSON', async () => {
      mockFetch(makeResponse({}))
      const client = createHttpClient()
      await client.patch('/items/1', { status: 'active' })
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      expect(init?.method).toBe('PATCH')
      expect(init?.body).toBe('{"status":"active"}')
    })

    it('delete sends no body', async () => {
      mockFetch(makeResponse({}))
      const client = createHttpClient()
      await client.delete('/items/1')
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      expect(init?.method).toBe('DELETE')
      expect(init?.body).toBeUndefined()
    })
  })

  describe('body parsing', () => {
    it('parses JSON when content-type includes application/json', async () => {
      mockFetch(makeResponse({ id: 42 }))
      const client = createHttpClient()
      const result = await client.get<{ id: number }>('/item')
      expect(isOk(result)).toBe(true)
      if (isOk(result)) expect(result.value.data.id).toBe(42)
    })

    it('parses plain text when content-type is not JSON', async () => {
      mockFetch(makeTextResponse('hello world'))
      const client = createHttpClient()
      const result = await client.get<string>('/text')
      expect(isOk(result)).toBe(true)
      if (isOk(result)) expect(result.value.data).toBe('hello world')
    })

    it('parses as text when content-type header is absent', async () => {
      // Blob without a type produces no content-type header (per Fetch spec §5.2),
      // which forces the `?? ''` branch in parseBody to use the fallback empty string.
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(new Response(new Blob(['raw body']), { status: 200 })),
      )
      const client = createHttpClient()
      const result = await client.get<string>('/raw')
      expect(isOk(result)).toBe(true)
      if (isOk(result)) expect(result.value.data).toBe('raw body')
    })
  })

  describe('error handling', () => {
    it('returns err(HttpError) for non-2xx responses', async () => {
      mockFetch(new Response('Not Found', { status: 404, statusText: 'Not Found' }))
      const client = createHttpClient()
      const result = await client.get('/missing')
      expect(isErr(result)).toBe(true)
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(HttpError)
        expect((result.error as HttpError).status).toBe(404)
      }
    })

    it('returns err(TimeoutError) when request exceeds timeout', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, init: RequestInit) => {
          return new Promise((_resolve, reject) => {
            init.signal?.addEventListener('abort', () => {
              const e = new Error('The operation was aborted.')
              e.name = 'AbortError'
              reject(e)
            })
          })
        }),
      )
      const client = createHttpClient({ timeout: 50 })
      const result = await client.get('/slow')
      expect(isErr(result)).toBe(true)
      if (isErr(result)) expect(result.error).toBeInstanceOf(TimeoutError)
    })

    it('clears timeout when request completes within timeout', async () => {
      mockFetch(makeResponse({ ok: true }))
      const client = createHttpClient({ timeout: 5000 })
      const result = await client.get('/fast')
      expect(isOk(result)).toBe(true)
    })

    it('clears timeout on network error with timeout configured', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      const client = createHttpClient({ timeout: 5000 })
      await expect(client.get('/')).rejects.toThrow('Network error')
    })

    it('forwards an external AbortSignal to fetch', async () => {
      mockFetch(makeResponse({}))
      const client = createHttpClient()
      const controller = new AbortController()
      const result = await client.get('/', { signal: controller.signal })
      expect(isOk(result)).toBe(true)
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      expect(init?.signal).toBeDefined()
    })

    it('rethrows an external abort signal', async () => {
      const controller = new AbortController()
      controller.abort()
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((_url: string, init: RequestInit) => {
          return new Promise((_resolve, reject) => {
            if (init.signal?.aborted) {
              const e = new Error('The operation was aborted.')
              e.name = 'AbortError'
              reject(e)
            }
          })
        }),
      )
      const client = createHttpClient()
      await expect(client.get('/', { signal: controller.signal })).rejects.toMatchObject({
        name: 'AbortError',
      })
    })

    it('rethrows unexpected network errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
      const client = createHttpClient()
      await expect(client.get('/')).rejects.toThrow('Network error')
    })
  })

  describe('interceptors', () => {
    it('applies request interceptors in order', async () => {
      mockFetch(makeResponse({}))
      const calls: string[] = []
      const client = createHttpClient({
        requestInterceptors: [
          (init) => {
            calls.push('first')
            return init
          },
          (init) => {
            calls.push('second')
            return init
          },
        ],
      })
      await client.get('/')
      expect(calls).toEqual(['first', 'second'])
    })

    it('applies response interceptors in order', async () => {
      mockFetch(makeResponse({}))
      const calls: string[] = []
      const client = createHttpClient({
        responseInterceptors: [
          (res) => {
            calls.push('first')
            return res
          },
          (res) => {
            calls.push('second')
            return res
          },
        ],
      })
      await client.get('/')
      expect(calls).toEqual(['first', 'second'])
    })

    it('request interceptor can modify headers', async () => {
      mockFetch(makeResponse({}))
      const client = createHttpClient({
        requestInterceptors: [
          (init) => ({
            ...init,
            headers: { ...(init.headers as Record<string, string>), 'X-Added': 'yes' },
          }),
        ],
      })
      await client.get('/')
      const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
      expect((init?.headers as Record<string, string>)['X-Added']).toBe('yes')
    })
  })
})

// ─── HttpError ────────────────────────────────────────────────────────────────

describe('HttpError', () => {
  it('is an instance of Error', () => {
    const res = new Response('', { status: 404, statusText: 'Not Found' })
    expect(new HttpError(res)).toBeInstanceOf(Error)
  })

  it('has name "HttpError"', () => {
    const res = new Response('', { status: 404, statusText: 'Not Found' })
    expect(new HttpError(res).name).toBe('HttpError')
  })

  it('exposes status and response', () => {
    const res = new Response('', { status: 422, statusText: 'Unprocessable' })
    const error = new HttpError(res)
    expect(error.status).toBe(422)
    expect(error.response).toBe(res)
  })

  it('message contains the status code', () => {
    const res = new Response('', { status: 403, statusText: 'Forbidden' })
    expect(new HttpError(res).message).toContain('403')
  })
})

// ─── TimeoutError ─────────────────────────────────────────────────────────────

describe('TimeoutError', () => {
  it('is an instance of Error', () => {
    expect(new TimeoutError(1000)).toBeInstanceOf(Error)
  })

  it('has name "TimeoutError"', () => {
    expect(new TimeoutError(1000).name).toBe('TimeoutError')
  })

  it('message includes the timeout duration', () => {
    expect(new TimeoutError(5000).message).toContain('5000')
  })
})
