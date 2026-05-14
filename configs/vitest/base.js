/**
 * @param {import('vitest').InlineConfig} [overrides]
 * @returns {import('vitest').InlineConfig}
 */
export function createBaseConfig(overrides = {}) {
  return {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    },
    ...overrides,
  }
}
