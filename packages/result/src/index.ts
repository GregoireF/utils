export type { Ok, Err, Result } from './result.js'
export {
  ResultError,
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  flatMap,
  unwrap,
  unwrapOr,
  unwrapOrElse,
  fromThrowable,
  fromPromise,
} from './result.js'
