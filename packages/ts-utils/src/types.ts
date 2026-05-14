/**
 * `T | null | undefined` — a nullable wrapper that covers both "no value" states.
 * Prefer this over `T | null` or `T | undefined` alone when a value may be absent for any reason.
 */
export type Nullable<T> = T | null | undefined

/**
 * Recursively makes every property of `T` optional and accepts explicit `undefined`.
 * The `| undefined` union is required for `exactOptionalPropertyTypes` compatibility,
 * which distinguishes a missing property from one set to `undefined`.
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> | undefined }
  : T

/**
 * Forces TypeScript to expand and display a type in full, rather than showing
 * the intersected alias. Useful for exposing complex mapped types in IDE hovers.
 */
export type Prettify<T> = { [K in keyof T]: T[K] } & {}

/** Union of all value types in an object type. */
export type ValueOf<T> = T[keyof T]

/** Makes every nested property required and non-nullable. */
export type DeepRequired<T> = T extends object
  ? { [P in keyof T]-?: DeepRequired<NonNullable<T[P]>> }
  : NonNullable<T>
