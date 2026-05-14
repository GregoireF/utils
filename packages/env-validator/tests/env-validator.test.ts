import { describe, expect, expectTypeOf, it } from 'vitest'
import { EnvValidationError, createEnv, v } from '../src/index.js'

function env(overrides: Record<string, string | undefined> = {}) {
  return overrides
}

describe('v.string()', () => {
  it('returns the raw string value', () => {
    const result = createEnv({ KEY: v.string() }, env({ KEY: 'hello' }))
    expect(result.KEY).toBe('hello')
  })

  it('throws when required var is missing', () => {
    expect(() => createEnv({ KEY: v.string() }, env())).toThrow(EnvValidationError)
  })

  it('throws when required var is empty string', () => {
    expect(() => createEnv({ KEY: v.string() }, env({ KEY: '' }))).toThrow(EnvValidationError)
  })

  it('.optional() returns undefined when missing', () => {
    const result = createEnv({ KEY: v.string().optional() }, env())
    expect(result.KEY).toBeUndefined()
  })

  it('.default() uses the default when missing', () => {
    const result = createEnv({ KEY: v.string().default('fallback') }, env())
    expect(result.KEY).toBe('fallback')
  })

  it('.url() validates URL format', () => {
    const result = createEnv({ URL: v.string().url() }, env({ URL: 'https://example.com' }))
    expect(result.URL).toBe('https://example.com')
  })

  it('.url() throws on invalid URL', () => {
    expect(() => createEnv({ URL: v.string().url() }, env({ URL: 'not-a-url' }))).toThrow(
      EnvValidationError,
    )
  })

  it('infers correct type for required field', () => {
    const result = createEnv({ KEY: v.string() }, env({ KEY: 'x' }))
    expectTypeOf(result.KEY).toBeString()
  })

  it('infers string | undefined for optional without default', () => {
    const result = createEnv({ KEY: v.string().optional() }, env())
    expectTypeOf(result.KEY).toMatchTypeOf<string | undefined>()
  })

  it('infers string (not undefined) for optional with default', () => {
    const result = createEnv({ KEY: v.string().optional().default('d') }, env())
    expectTypeOf(result.KEY).toBeString()
  })
})

describe('v.number()', () => {
  it('coerces string to number', () => {
    const result = createEnv({ PORT: v.number() }, env({ PORT: '3000' }))
    expect(result.PORT).toBe(3000)
    expect(typeof result.PORT).toBe('number')
  })

  it('throws on non-numeric value', () => {
    expect(() => createEnv({ PORT: v.number() }, env({ PORT: 'abc' }))).toThrow(EnvValidationError)
  })

  it('.min() rejects values below minimum', () => {
    expect(() => createEnv({ PORT: v.number().min(1024) }, env({ PORT: '80' }))).toThrow(
      EnvValidationError,
    )
  })

  it('.max() rejects values above maximum', () => {
    expect(() => createEnv({ PORT: v.number().max(9999) }, env({ PORT: '65535' }))).toThrow(
      EnvValidationError,
    )
  })

  it('.min() and .max() pass valid range', () => {
    const result = createEnv({ PORT: v.number().min(1024).max(9999) }, env({ PORT: '3000' }))
    expect(result.PORT).toBe(3000)
  })

  it('.default() uses default when missing', () => {
    const result = createEnv({ PORT: v.number().default(3000) }, env())
    expect(result.PORT).toBe(3000)
  })

  it('infers number type', () => {
    const result = createEnv({ PORT: v.number() }, env({ PORT: '8080' }))
    expectTypeOf(result.PORT).toBeNumber()
  })

  it('infers number | undefined for optional without default', () => {
    const result = createEnv({ PORT: v.number().optional() }, env())
    expectTypeOf(result.PORT).toMatchTypeOf<number | undefined>()
  })
})

describe('v.boolean()', () => {
  it.each([
    ['true', true],
    ['1', true],
    ['false', false],
    ['0', false],
  ])('parses "%s" → %s', (raw, expected) => {
    const result = createEnv({ FLAG: v.boolean() }, env({ FLAG: raw }))
    expect(result.FLAG).toBe(expected)
  })

  it('throws when required var is missing', () => {
    expect(() => createEnv({ FLAG: v.boolean() }, env())).toThrow(EnvValidationError)
  })

  it('throws on invalid boolean string', () => {
    expect(() => createEnv({ FLAG: v.boolean() }, env({ FLAG: 'yes' }))).toThrow(EnvValidationError)
  })

  it('.optional() returns undefined when missing', () => {
    const result = createEnv({ FLAG: v.boolean().optional() }, env())
    expect(result.FLAG).toBeUndefined()
  })

  it('.default() uses default when missing', () => {
    const result = createEnv({ DEBUG: v.boolean().default(false) }, env())
    expect(result.DEBUG).toBe(false)
  })

  it('infers boolean type', () => {
    const result = createEnv({ FLAG: v.boolean() }, env({ FLAG: 'true' }))
    expectTypeOf(result.FLAG).toBeBoolean()
  })
})

describe('v.enum()', () => {
  const environments = ['development', 'production', 'test'] as const

  it('accepts valid enum members', () => {
    const result = createEnv({ NODE_ENV: v.enum(environments) }, env({ NODE_ENV: 'production' }))
    expect(result.NODE_ENV).toBe('production')
  })

  it('throws on invalid value', () => {
    expect(() =>
      createEnv({ NODE_ENV: v.enum(environments) }, env({ NODE_ENV: 'staging' })),
    ).toThrow(EnvValidationError)
  })

  it('.optional() returns undefined when missing', () => {
    const result = createEnv({ NODE_ENV: v.enum(environments).optional() }, env())
    expect(result.NODE_ENV).toBeUndefined()
  })

  it('.default() uses default when missing', () => {
    const result = createEnv({ NODE_ENV: v.enum(environments).default('development') }, env())
    expect(result.NODE_ENV).toBe('development')
  })

  it('infers the literal union type', () => {
    const result = createEnv({ NODE_ENV: v.enum(environments) }, env({ NODE_ENV: 'test' }))
    expectTypeOf(result.NODE_ENV).toMatchTypeOf<'development' | 'production' | 'test'>()
  })

  it('infers optional literal union', () => {
    const result = createEnv({ NODE_ENV: v.enum(environments).optional() }, env())
    expectTypeOf(result.NODE_ENV).toMatchTypeOf<'development' | 'production' | 'test' | undefined>()
  })
})

describe('createEnv()', () => {
  it('validates a complete schema successfully', () => {
    const result = createEnv(
      {
        DATABASE_URL: v.string().url(),
        PORT: v.number().default(3000),
        NODE_ENV: v.enum(['development', 'production'] as const),
        DEBUG: v.boolean().optional(),
      },
      env({
        DATABASE_URL: 'https://db.example.com',
        NODE_ENV: 'production',
      }),
    )
    expect(result.DATABASE_URL).toBe('https://db.example.com')
    expect(result.PORT).toBe(3000)
    expect(result.NODE_ENV).toBe('production')
    expect(result.DEBUG).toBeUndefined()
  })

  it('collects ALL validation errors before throwing', () => {
    try {
      createEnv(
        {
          A: v.string(),
          B: v.number(),
          C: v.enum(['x', 'y'] as const),
        },
        env(),
      )
      expect.fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(EnvValidationError)
      expect((e as EnvValidationError).errors).toHaveLength(3)
    }
  })

  it('EnvValidationError lists each failing key', () => {
    try {
      createEnv({ MISSING: v.string() }, env())
    } catch (e) {
      expect((e as EnvValidationError).message).toContain('MISSING')
      expect((e as EnvValidationError).errors[0]).toContain('MISSING')
    }
  })

  it('EnvValidationError has name "EnvValidationError"', () => {
    try {
      createEnv({ K: v.string() }, env())
    } catch (e) {
      expect((e as Error).name).toBe('EnvValidationError')
    }
  })
})
