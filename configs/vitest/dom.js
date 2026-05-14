import { createBaseConfig } from './base.js'

/**
 * @param {import('vitest').InlineConfig} [overrides]
 * @returns {import('vitest').InlineConfig}
 */
export function createDomConfig(overrides = {}) {
  return createBaseConfig({ environment: 'jsdom', ...overrides })
}
