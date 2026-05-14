# @gregoiref/tsconfig

[![version](https://img.shields.io/github/v/tag/GregoireF/utils?filter=%40gregoiref%2Ftsconfig%40*&label=version&color=blue)](https://github.com/GregoireF/utils/tags)
[![CI](https://github.com/GregoireF/utils/actions/workflows/ci.yml/badge.svg)](https://github.com/GregoireF/utils/actions/workflows/ci.yml)
[![license](https://img.shields.io/badge/license-MIT-blue)](https://github.com/GregoireF/utils/blob/main/LICENSE)

Shared strict TypeScript configurations — base, node, dom, astro, nuxt.

## Why

Most projects start from `"strict": true` and then progressively add the remaining strictness flags when they discover bugs. This config enables **all** strict flags from the start — including the ones TypeScript doesn't enable by default (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, `noPropertyAccessFromIndexSignature`) — so the type system catches a wider class of bugs upfront rather than after the fact.

## Installation

```bash
pnpm add -D @gregoiref/tsconfig
```

> Requires GitHub Packages — add `@gregoiref:registry=https://npm.pkg.github.com` to your `.npmrc`.

## Usage

Pick the config that matches your project's environment:

```jsonc
// tsconfig.json
{ "extends": "@gregoiref/tsconfig/base" }   // library / framework-agnostic
{ "extends": "@gregoiref/tsconfig/node" }   // Node.js (adds node types)
{ "extends": "@gregoiref/tsconfig/dom" }    // Browser / Vite / SPA
{ "extends": "@gregoiref/tsconfig/astro" }  // Astro projects
{ "extends": "@gregoiref/tsconfig/nuxt" }   // Nuxt 3 projects
```

## Base compiler options

| Option | Value | Why |
|---|---|---|
| `strict` | `true` | Enables the standard strict group |
| `exactOptionalPropertyTypes` | `true` | Distinguishes missing properties from `undefined`-valued ones |
| `noUncheckedIndexedAccess` | `true` | Index-signature access returns `T \| undefined`, not `T` |
| `noPropertyAccessFromIndexSignature` | `true` | Forces bracket notation on index-signature properties |
| `noImplicitOverride` | `true` | Class overrides must be explicit |
| `noFallthroughCasesInSwitch` | `true` | Every `case` must break or return |
| `target` | `ES2022` | Modern output — no class-fields downcompilation |
| `module` | `ESNext` | Native ESM — preserves `import`/`export` |
| `moduleResolution` | `bundler` | Works with Vite, tsup, pkgroll — no `.js` extension hacks |
| `moduleDetection` | `force` | Every file is a module, preventing global-scope collisions |
| `verbatimModuleSyntax` | `true` | Type-only imports must use `import type` |
| `isolatedModules` | `true` | Compatible with single-file transpilers (esbuild, swc) |
| `esModuleInterop` | `false` | No synthetic default imports — cleaner interop |
| `resolveJsonModule` | `true` | `import data from './data.json'` works |
| `declaration` | `true` | Emits `.d.ts` files |
| `declarationMap` | `true` | Maps declarations back to source for IDE navigation |
| `sourceMap` | `true` | Enables debugger source mapping |

## Limitations

- `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess` can require extra `| undefined` annotations and guarded access patterns. They will surface real bugs but require minor adjustments in existing code.
- `noPropertyAccessFromIndexSignature` conflicts with Biome's `useLiteralKeys` rule — use `@gregoiref/biome-config` which includes the matching override for test files.
- `moduleResolution: bundler` is not compatible with plain `tsc`-compiled Node projects that do not use a bundler — use `/node` config for those.
