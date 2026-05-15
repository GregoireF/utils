// Fuzz target for @gregoiref/env-validator
// Run: npx jazzer fuzz/env-validator.fuzz.js
'use strict'

const { createEnv, v } = require('../packages/env-validator/dist/index.js')

const SCHEMA = {
  PORT: v.number().min(1).max(65535).default(3000),
  HOST: v.string().default('localhost'),
  DEBUG: v.boolean().optional(),
  NODE_ENV: v.enum(['development', 'production', 'test']).default('development'),
}

/**
 * @param {Buffer} data
 */
function fuzz(data) {
  const str = data.toString('utf-8')
  const lines = str.split('\n')

  // Build an env source from fuzz input lines: "KEY=value"
  const source = {}
  for (const line of lines) {
    const eq = line.indexOf('=')
    if (eq > 0) {
      source[line.slice(0, eq)] = line.slice(eq + 1)
    }
  }

  try {
    createEnv(SCHEMA, source)
  } catch {
    // EnvValidationError is expected — validation rejects invalid input
  }
}

module.exports = { fuzz }
