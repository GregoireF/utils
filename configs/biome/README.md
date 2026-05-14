# @gregoiref/biome-config

![npm version](https://img.shields.io/npm/v/@gregoiref/biome-config)
![license](https://img.shields.io/npm/l/@gregoiref/biome-config)

Shared [Biome](https://biomejs.dev) configuration for TypeScript projects — lint + format in one tool.

## Why

Biome replaces ESLint + Prettier with a single Rust-powered tool that is 10–100× faster and requires no plugin ecosystem. This config provides an opinionated baseline tuned for strict TypeScript projects with one notable override: `useLiteralKeys` is disabled for test files because `noPropertyAccessFromIndexSignature: true` (from `@gregoiref/tsconfig`) forces bracket notation on index-signature properties — which would otherwise conflict.

## Installation

```bash
pnpm add -D @gregoiref/biome-config @biomejs/biome
```

## Usage

In your `biome.json`:

```json
{
  "extends": ["@gregoiref/biome-config"]
}
```

That's it. The config is self-contained — no additional plugins or rules to install.

## What's included

### Linter rules

| Category | Rule | Level |
|---|---|---|
| `correctness` | `noUnusedVariables` | error |
| `correctness` | `noUnusedImports` | error |
| `correctness` | `noUnusedFunctionParameters` | warn |
| `suspicious` | `noExplicitAny` | warn |
| `suspicious` | `noConsoleLog` | warn |
| `style` | `noNonNullAssertion` | warn |
| `style` | `useConst` | error |
| `style` | `useTemplate` | error |
| `style` | `useNodejsImportProtocol` | error |
| `complexity` | `noExcessiveCognitiveComplexity` | warn |

Plus all `recommended` rules.

### Formatter

| Setting | Value |
|---|---|
| Indent style | spaces |
| Indent width | 2 |
| Line width | 100 |
| Line ending | LF |
| Quotes | single |
| Trailing commas | all |
| Semicolons | as-needed |
| Arrow parens | always |

### Overrides

Test files (`**/*.test.ts`, `**/*.spec.ts`) disable `complexity/useLiteralKeys` to allow bracket notation required by `noPropertyAccessFromIndexSignature`.

### Ignored paths

`node_modules`, `dist`, `.turbo`, `coverage`, `*.min.js`, `pnpm-lock.yaml`

## Limitations

- Targets Biome `>=1.9.0`. Older versions may not support all rules.
- Overriding individual rules requires re-declaring them in your local `biome.json` with the `extends` key preserved.
