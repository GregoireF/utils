// Fuzz target for @gregoiref/result
// Run: npx jazzer fuzz/result.fuzz.js
'use strict'

const { ok, err, isOk, isErr, map, flatMap, unwrapOr, fromThrowable } = require('../packages/result/dist/index.js')

/**
 * @param {Buffer} data
 */
function fuzz(data) {
  const str = data.toString('utf-8')

  // Exercise all Result combinators with arbitrary input
  const r1 = fromThrowable(() => JSON.parse(str))

  if (isOk(r1)) {
    const mapped = map(r1, (v) => String(v))
    unwrapOr(mapped, '')

    const chained = flatMap(r1, (v) => (v !== null ? ok(v) : err(new Error('null'))))
    isErr(chained)
  }

  // ok/err with arbitrary string values
  const r2 = str.length % 2 === 0 ? ok(str) : err(new Error(str.slice(0, 100)))
  unwrapOr(r2, 'fallback')
}

module.exports = { fuzz }
