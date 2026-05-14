import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HttpError, TimeoutError, createHttpClient } from '../src/http-client.js'

// ─── Fetch mock helpers ────────────────────────────────────────────────────────

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

  it('performs a GET request to the given URL', async () => {
    mockFetch(makeResponse({ ok: true }))
    const client = createHttpClient()
    const res = await client.get<{ ok: boolean }>('/users')
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      '/users',
      expect.objectContaining({ method: 'GET' }),
    )
    expect(res.data.ok).toBe(true)
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

  it('returns status and headers on the response', async () => {
    mockFetch(
      makeResponse({ done: true }, 201, { 'content-type': 'application/json', 'x-id': '42' }),
    )
    const client = createHttpClient()
    const res = await client.post<{ done: boolean }>('/')
    expect(res.status).toBe(201)
    expect(res.headers['x-id']).toBe('42')
  })

  it('sends body as JSON for POST', async () => {
    mockFetch(makeResponse({ created: true }))
    const client = createHttpClient()
    await client.post('/items', { name: 'test' })
    const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(init?.body).toBe('{"name":"test"}')
    const headers = init?.headers as Record<string, string>
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('sends body for PUT and PATCH', async () => {
    mockFetch(makeResponse({}))
    const client = createHttpClient()
    await client.put('/items/1', { name: 'updated' })
    const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(init?.body).toBe('{"name":"updated"}')
    expect((init?.headers as Record<string, string>)['Content-Type']).toBe('application/json')
  })

  it('performs DELETE requests without a body', async () => {
    mockFetch(makeResponse({}))
    const client = createHttpClient()
    await client.delete('/items/1')
    const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(init?.method).toBe('DELETE')
    expect(init?.body).toBeUndefined()
  })

  it('returns text when content-type is not JSON', async () => {
    mockFetch(makeTextResponse('plain text'))
    const client = createHttpClient()
    const res = await client.get<string>('/text')
    expect(res.data).toBe('plain text')
  })

  it('throws HttpError for non-2xx responses', async () => {
    mockFetch(new Response('Not Found', { status: 404, statusText: 'Not Found' }))
    const client = createHttpClient()
    await expect(client.get('/missing')).rejects.toBeInstanceOf(HttpError)
  })

  it('HttpError includes the status code', async () => {
    mockFetch(new Response('', { status: 500, statusText: 'Server Error' }))
    const client = createHttpClient()
    try {
      await client.get('/error')
    } catch (e) {
      expect(e).toBeInstanceOf(HttpError)
      expect((e as HttpError).status).toBe(500)
    }
  })

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

  it('request interceptor can add headers', async () => {
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

  it('performs PATCH requests with body', async () => {
    mockFetch(makeResponse({}))
    const client = createHttpClient()
    await client.patch('/items/1', { status: 'active' })
    const [, init] = vi.mocked(fetch).mock.calls[0] ?? []
    expect(init?.method).toBe('PATCH')
    expect(init?.body).toBe('{"status":"active"}')
  })

  it('throws TimeoutError when the request exceeds the timeout', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((_url: string, init: RequestInit) => {
        return new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => {
            const err = new Error('The operation was aborted.')
            err.name = 'AbortError'
            reject(err)
          })
        })
      }),
    )
    const client = createHttpClient({ timeout: 50 })
    await expect(client.get('/slow')).rejects.toBeInstanceOf(TimeoutError)
  })

  it('re-throws non-abort fetch errors unchanged', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const client = createHttpClient()
    await expect(client.get('/')).rejects.toThrow('Network error')
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

// ─── HttpError ────────────────────────────────────────────────────────────────

describe('HttpError', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

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
    const err = new HttpError(res)
    expect(err.status).toBe(422)
    expect(err.response).toBe(res)
  })

  it('message contains the status code', () => {
    const res = new Response('', { status: 403, statusText: 'Forbidden' })
    expect(new HttpError(res).message).toContain('403')
  })
})
