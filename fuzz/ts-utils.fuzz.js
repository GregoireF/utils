// Fuzz target for @gregoiref/ts-utils — exercises deepMerge prototype pollution guard
// Run: npx jazzer fuzz/ts-utils.fuzz.js
'use strict'

const { deepMerge, pick, omit, groupBy } = require('../packages/ts-utils/dist/index.js')

/**
 * @param {Buffer} data
 */
function fuzz(data) {
  const str = data.toString('utf-8')

  try {
    const parsed = JSON.parse(str)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      // Primary target: prototype pollution guard on deepMerge
      deepMerge({ a: 1, b: { c: 2 } }, parsed)

      // Snapshot: prototype must remain clean
      if (({}).evil !== undefined) throw new Error('Prototype polluted!')
    }

    if (Array.isArray(parsed)) {
      const strArr = parsed.map(String)
      groupBy(strArr, (s) => s[0] ?? '')
      pick({ a: 1, b: 2, c: 3 }, ['a', 'b'])
      omit({ a: 1, b: 2, c: 3 }, ['c'])
    }
  } catch (e) {
    // JSON parse errors and expected TypeErrors are fine
    if (e.message === 'Prototype polluted!') throw e
  }
}

module.exports = { fuzz }
