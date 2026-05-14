// ─── Internal parse helpers ───────────────────────────────────────────────────

function parseBoolean(raw: string): boolean {
  if (raw === 'true' || raw === '1') return true
  if (raw === 'false' || raw === '0') return false
  throw new Error(`expected "true", "false", "1" or "0", got "${raw}"`)
}

function parseNumber(raw: string): number {
  const n = Number(raw)
  if (Number.isNaN(n)) throw new Error(`expected a number, got "${raw}"`)
  return n
}

function assertUrl(raw: string): void {
  try {
    new URL(raw)
  } catch {
    throw new Error(`expected a valid URL, got "${raw}"`)
  }
}

// ─── Validator classes ────────────────────────────────────────────────────────
// Each class is generic over two boolean literal type parameters:
//   Opt — whether the field is optional (absent env var is allowed)
//   Def — whether a default value was provided (absent env var gets a fallback)
//
// These literals propagate through the fluent chain so InferValidator can resolve
// the exact output type at compile time without any runtime casting:
//   Opt=false | Def=true  → T           (value always present)
//   Opt=true  & Def=false → T | undefined

/**
 * Validator for string environment variables.
 * Chain `.optional()`, `.default()`, or `.url()` to refine the constraint.
 */
export class StringValidator<Opt extends boolean = false, Def extends boolean = false> {
  private readonly _opt: Opt
  private readonly _hasDef: Def
  private readonly _defVal: string | undefined
  private readonly _isUrl: boolean

  constructor(opt: Opt, hasDef: Def, defVal?: string, isUrl = false) {
    this._opt = opt
    this._hasDef = hasDef
    this._defVal = defVal
    this._isUrl = isUrl
  }

  optional(): StringValidator<true, Def> {
    return new StringValidator(true, this._hasDef, this._defVal, this._isUrl)
  }

  default(val: string): StringValidator<Opt, true> {
    return new StringValidator(this._opt, true as true, val, this._isUrl)
  }

  url(): StringValidator<Opt, Def> {
    return new StringValidator(this._opt, this._hasDef, this._defVal, true)
  }

  _resolve(
    key: string,
    raw: string | undefined,
  ): { value: string | undefined } | { error: string } {
    if (raw === undefined || raw === '') {
      if (this._hasDef && this._defVal !== undefined) return { value: this._defVal }
      if (this._opt) return { value: undefined }
      return { error: `Missing required env var: ${key}` }
    }
    if (this._isUrl) {
      try {
        assertUrl(raw)
      } catch (e) {
        return { error: `${key}: ${(e as Error).message}` }
      }
    }
    return { value: raw }
  }
}

/**
 * Validator for numeric environment variables.
 * Chain `.optional()`, `.default()`, `.min()`, or `.max()` to refine the constraint.
 */
export class NumberValidator<Opt extends boolean = false, Def extends boolean = false> {
  private readonly _opt: Opt
  private readonly _hasDef: Def
  private readonly _defVal: number | undefined
  private readonly _min: number | undefined
  private readonly _max: number | undefined

  constructor(opt: Opt, hasDef: Def, defVal?: number, min?: number, max?: number) {
    this._opt = opt
    this._hasDef = hasDef
    this._defVal = defVal
    this._min = min
    this._max = max
  }

  optional(): NumberValidator<true, Def> {
    return new NumberValidator(true, this._hasDef, this._defVal, this._min, this._max)
  }

  default(val: number): NumberValidator<Opt, true> {
    return new NumberValidator(this._opt, true as true, val, this._min, this._max)
  }

  min(n: number): NumberValidator<Opt, Def> {
    return new NumberValidator(this._opt, this._hasDef, this._defVal, n, this._max)
  }

  max(n: number): NumberValidator<Opt, Def> {
    return new NumberValidator(this._opt, this._hasDef, this._defVal, this._min, n)
  }

  _resolve(
    key: string,
    raw: string | undefined,
  ): { value: number | undefined } | { error: string } {
    if (raw === undefined || raw === '') {
      if (this._hasDef && this._defVal !== undefined) return { value: this._defVal }
      if (this._opt) return { value: undefined }
      return { error: `Missing required env var: ${key}` }
    }
    let n: number
    try {
      n = parseNumber(raw)
    } catch (e) {
      return { error: `${key}: ${(e as Error).message}` }
    }
    if (this._min !== undefined && n < this._min)
      return { error: `${key}: value ${n} is below minimum ${this._min}` }
    if (this._max !== undefined && n > this._max)
      return { error: `${key}: value ${n} is above maximum ${this._max}` }
    return { value: n }
  }
}

/**
 * Validator for boolean environment variables.
 * Accepts `"true"` / `"1"` (true) and `"false"` / `"0"` (false).
 * Chain `.optional()` or `.default()` to refine the constraint.
 */
export class BooleanValidator<Opt extends boolean = false, Def extends boolean = false> {
  private readonly _opt: Opt
  private readonly _hasDef: Def
  private readonly _defVal: boolean | undefined

  constructor(opt: Opt, hasDef: Def, defVal?: boolean) {
    this._opt = opt
    this._hasDef = hasDef
    this._defVal = defVal
  }

  optional(): BooleanValidator<true, Def> {
    return new BooleanValidator(true, this._hasDef, this._defVal)
  }

  default(val: boolean): BooleanValidator<Opt, true> {
    return new BooleanValidator(this._opt, true as true, val)
  }

  _resolve(
    key: string,
    raw: string | undefined,
  ): { value: boolean | undefined } | { error: string } {
    if (raw === undefined || raw === '') {
      if (this._hasDef && this._defVal !== undefined) return { value: this._defVal }
      if (this._opt) return { value: undefined }
      return { error: `Missing required env var: ${key}` }
    }
    try {
      return { value: parseBoolean(raw) }
    } catch (e) {
      return { error: `${key}: ${(e as Error).message}` }
    }
  }
}

/**
 * Validator for string-enum environment variables.
 * Rejects any value not present in the `values` array.
 * Chain `.optional()` or `.default()` to refine the constraint.
 */
export class EnumValidator<
  T extends string,
  Opt extends boolean = false,
  Def extends boolean = false,
> {
  private readonly _values: readonly T[]
  private readonly _opt: Opt
  private readonly _hasDef: Def
  private readonly _defVal: T | undefined

  constructor(values: readonly T[], opt: Opt, hasDef: Def, defVal?: T) {
    this._values = values
    this._opt = opt
    this._hasDef = hasDef
    this._defVal = defVal
  }

  optional(): EnumValidator<T, true, Def> {
    return new EnumValidator(this._values, true, this._hasDef, this._defVal)
  }

  default(val: T): EnumValidator<T, Opt, true> {
    return new EnumValidator(this._values, this._opt, true as true, val)
  }

  _resolve(key: string, raw: string | undefined): { value: T | undefined } | { error: string } {
    if (raw === undefined || raw === '') {
      if (this._hasDef && this._defVal !== undefined) return { value: this._defVal }
      if (this._opt) return { value: undefined }
      return { error: `Missing required env var: ${key}` }
    }
    if (!(this._values as readonly string[]).includes(raw)) {
      return {
        error: `${key}: expected one of [${this._values.map((v) => `"${v}"`).join(', ')}], got "${raw}"`,
      }
    }
    return { value: raw as T }
  }
}

// ─── AnyValidator union ───────────────────────────────────────────────────────

export type AnyValidator =
  | StringValidator<boolean, boolean>
  | NumberValidator<boolean, boolean>
  | BooleanValidator<boolean, boolean>
  | EnumValidator<string, boolean, boolean>

// ─── Type inference ───────────────────────────────────────────────────────────

export type InferValidator<V extends AnyValidator> = V extends StringValidator<infer O, infer D>
  ? O extends true
    ? D extends true
      ? string
      : string | undefined
    : string
  : V extends NumberValidator<infer O, infer D>
    ? O extends true
      ? D extends true
        ? number
        : number | undefined
      : number
    : V extends BooleanValidator<infer O, infer D>
      ? O extends true
        ? D extends true
          ? boolean
          : boolean | undefined
        : boolean
      : V extends EnumValidator<infer T, infer O, infer D>
        ? O extends true
          ? D extends true
            ? T
            : T | undefined
          : T
        : never

// ─── Fluent builder entry points ─────────────────────────────────────────────

/**
 * Entry point for declaring environment variable schemas.
 * Each method returns a validator with a chainable fluent API.
 *
 * @example
 * ```ts
 * const env = createEnv({
 *   HOST:     v.string().default('localhost'),
 *   PORT:     v.number().min(1).max(65535),
 *   DEBUG:    v.boolean().optional(),
 *   NODE_ENV: v.enum(['development', 'production', 'test'] as const),
 * })
 * ```
 */
export const v = {
  /** Creates a required string validator. Chain `.optional()`, `.default()`, `.url()`. */
  string: (): StringValidator<false, false> => new StringValidator(false, false),
  /** Creates a required number validator. Chain `.optional()`, `.default()`, `.min()`, `.max()`. */
  number: (): NumberValidator<false, false> => new NumberValidator(false, false),
  /** Creates a required boolean validator (`"true"/"1"` → `true`, `"false"/"0"` → `false`). */
  boolean: (): BooleanValidator<false, false> => new BooleanValidator(false, false),
  /** Creates a required enum validator restricted to the given string literals. */
  enum: <T extends string>(values: readonly T[]): EnumValidator<T, false, false> =>
    new EnumValidator(values, false, false),
}
