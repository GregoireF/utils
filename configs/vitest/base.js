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
        lines: 90,
        functions: 90,
        branches: 90,
        statements: 90,
      },
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts'],
    },
    ...overrides,
  }
}
