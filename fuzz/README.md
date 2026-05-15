# Fuzz targets

Coverage-guided fuzz tests using [Jazzer.js](https://github.com/CodeIntelligenceTesting/jazzer.js) (`@jazzer.js/core`).

## Run

```bash
# Build packages first
pnpm turbo run build

# Fuzz a specific target (Ctrl+C to stop)
npx jazzer fuzz/result.fuzz.js
npx jazzer fuzz/ts-utils.fuzz.js
npx jazzer fuzz/env-validator.fuzz.js
```

## Targets

| File | Package | What it tests |
|---|---|---|
| `result.fuzz.js` | `@gregoiref/result` | All combinators (`ok`, `err`, `map`, `flatMap`, `unwrapOr`, `fromThrowable`) with arbitrary JSON input |
| `ts-utils.fuzz.js` | `@gregoiref/ts-utils` | `deepMerge` prototype pollution guard, `pick`, `omit`, `groupBy` |
| `env-validator.fuzz.js` | `@gregoiref/env-validator` | Schema validation with arbitrary `KEY=value` env strings |
