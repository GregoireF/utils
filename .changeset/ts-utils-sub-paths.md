---
"@gregoiref/ts-utils": patch
---

Add sub-path exports for tree-shakable imports: `@gregoiref/ts-utils/array`, `@gregoiref/ts-utils/object`, and `@gregoiref/ts-utils/function`. The root barrel `@gregoiref/ts-utils` remains unchanged.

Also harden `deepMerge` against prototype pollution by skipping reserved keys (`__proto__`, `constructor`, `prototype`).
