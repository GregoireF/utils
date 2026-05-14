// ─── Types ─────────────────────────────────────────────────────────────────────

/** HTTP methods supported by {@link createHttpClient}. */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD'

/** Per-request options passed to individual method calls. */
export interface RequestOptions {
  method?: HttpMethod
  headers?: Record<string, string>
  body?: unknown
  /** Request-level timeout in ms. Overrides the client-level default. */
  timeout?: number
  /** External `AbortSignal` to cancel the request from outside the client. */
  signal?: AbortSignal
}

/** Typed response returned by every method on the HTTP client. */
export interface HttpResponse<T> {
  data: T
  status: number
  headers: Record<string, string>
}

// ─── Errors ────────────────────────────────────────────────────────────────────

/**
 * Thrown for any non-2xx HTTP response.
 * Preserves the original `Response` object for downstream inspection.
 */
export class HttpError extends Error {
  readonly status: number
  readonly response: Response

  constructor(response: Response) {
    super(`HTTP ${response.status}: ${response.statusText}`)
    this.name = 'HttpError'
    this.status = response.status
    this.response = response
  }
}

/**
 * Thrown when a request exceeds the configured timeout.
 * Distinguishes a client-initiated abort from an external one so callers
 * can react differently (retry vs. propagate).
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`)
    this.name = 'TimeoutError'
  }
}

// ─── Client options ────────────────────────────────────────────────────────────

/** A function that can transform a request or response before/after the fetch. */
export type Interceptor<T> = (value: T) => T | Promise<T>

/** Options accepted by {@link createHttpClient}. */
export interface HttpClientOptions {
  /** Prepended to every request URL. */
  baseUrl?: string
  /** Headers merged into every request (overridable per request). */
  defaultHeaders?: Record<string, string>
  /** Default timeout in ms applied to every request (overridable per request). */
  timeout?: number
  /** Functions applied to `RequestInit` in order before the fetch fires. */
  requestInterceptors?: Interceptor<RequestInit>[]
  /** Functions applied to `Response` in order after a successful fetch. */
  responseInterceptors?: Interceptor<Response>[]
}

// ─── Module-level helpers ─────────────────────────────────────────────────────
// Extracted from the factory closure so Biome's cognitive-complexity scorer does
// not penalise them for being nested. Each helper has a single responsibility.

function headersToRecord(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

type AbortSetup = {
  combinedSignal: AbortSignal | undefined
  controllers: AbortController[]
  timeoutId: ReturnType<typeof setTimeout> | undefined
}

/**
 * Combines the caller's `AbortSignal` (if any) with a new timeout controller
 * into a single signal via `AbortSignal.any`. The returned `controllers` array
 * lets the caller detect which side triggered the abort.
 */
function buildAbortSetup(
  userSignal: AbortSignal | undefined,
  timeout: number | undefined,
): AbortSetup {
  const signals: AbortSignal[] = []
  const controllers: AbortController[] = []
  let timeoutId: ReturnType<typeof setTimeout> | undefined

  if (userSignal) signals.push(userSignal)
  if (timeout !== undefined) {
    const controller = new AbortController()
    controllers.push(controller)
    signals.push(controller.signal)
    timeoutId = setTimeout(() => controller.abort(), timeout)
  }

  return {
    combinedSignal: signals.length > 0 ? AbortSignal.any(signals) : undefined,
    controllers,
    timeoutId,
  }
}

function buildRequestInit(
  method: HttpMethod,
  headers: Record<string, string>,
  body: unknown,
  signal: AbortSignal | undefined,
): RequestInit {
  return {
    method,
    headers: {
      ...headers,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    ...(signal ? { signal } : {}),
  }
}

async function applyInterceptors<T>(value: T, interceptors: Interceptor<T>[]): Promise<T> {
  let result = value
  for (const interceptor of interceptors) {
    result = await interceptor(result)
  }
  return result
}

/**
 * Executes the fetch and translates an `AbortError` that originated from the
 * timeout controller into a {@link TimeoutError} for clearer error semantics.
 */
async function tryFetch(
  fullUrl: string,
  init: RequestInit,
  setup: AbortSetup,
  timeout: number | undefined,
): Promise<Response> {
  try {
    return await fetch(fullUrl, init)
  } catch (err) {
    if (setup.timeoutId !== undefined) clearTimeout(setup.timeoutId)
    const isAbort = err instanceof Error && err.name === 'AbortError'
    if (isAbort && setup.controllers.some((c) => c.signal.aborted)) {
      throw new TimeoutError(timeout as number)
    }
    throw err
  }
}

/** Parses the response body as JSON or plain text based on the `content-type` header. */
async function parseBody<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? ''
  return contentType.includes('application/json')
    ? ((await response.json()) as T)
    : ((await response.text()) as T)
}

// ─── Factory ──────────────────────────────────────────────────────────────────

/**
 * Creates a typed HTTP client backed by the global `fetch`.
 *
 * @param options - Client-level defaults shared across all requests.
 * @returns An object with `get`, `post`, `put`, `patch`, `delete`, and `request` methods.
 *
 * @example
 * ```ts
 * const api = createHttpClient({
 *   baseUrl: 'https://api.example.com',
 *   defaultHeaders: { Authorization: `Bearer ${token}` },
 *   timeout: 5000,
 * })
 *
 * const { data } = await api.get<User[]>('/users')
 * ```
 */
export function createHttpClient(options: HttpClientOptions = {}) {
  const {
    baseUrl = '',
    defaultHeaders = {},
    timeout: defaultTimeout,
    requestInterceptors = [],
    responseInterceptors = [],
  } = options

  async function request<T>(url: string, opts: RequestOptions = {}): Promise<HttpResponse<T>> {
    const { method = 'GET', headers = {}, body, timeout = defaultTimeout, signal } = opts
    const setup = buildAbortSetup(signal, timeout)
    let init = buildRequestInit(
      method,
      { ...defaultHeaders, ...headers },
      body,
      setup.combinedSignal,
    )

    init = await applyInterceptors(init, requestInterceptors)
    let response = await tryFetch(`${baseUrl}${url}`, init, setup, timeout)

    if (setup.timeoutId !== undefined) clearTimeout(setup.timeoutId)
    response = await applyInterceptors(response, responseInterceptors)

    if (!response.ok) throw new HttpError(response)

    return {
      data: await parseBody<T>(response),
      status: response.status,
      headers: headersToRecord(response.headers),
    }
  }

  return {
    /** Sends a GET request. */
    get: <T>(url: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(url, { ...opts, method: 'GET' }),
    /** Sends a POST request with an optional JSON body. */
    post: <T>(url: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(url, { ...opts, method: 'POST', body }),
    /** Sends a PUT request with an optional JSON body. */
    put: <T>(url: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(url, { ...opts, method: 'PUT', body }),
    /** Sends a PATCH request with an optional JSON body. */
    patch: <T>(url: string, body?: unknown, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(url, { ...opts, method: 'PATCH', body }),
    /** Sends a DELETE request (no body). */
    delete: <T>(url: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
      request<T>(url, { ...opts, method: 'DELETE' }),
    /** Low-level method for full control over method and body. */
    request,
  }
}

/** The type of the client object returned by {@link createHttpClient}. */
export type HttpClient = ReturnType<typeof createHttpClient>
