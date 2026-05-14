# @gregoiref/ts-utils

## 0.0.1

### Patch Changes

- 83aee3f: Add sub-path exports for tree-shakable imports: `@gregoiref/ts-utils/array`, `@gregoiref/ts-utils/object`, and `@gregoiref/ts-utils/function`. The root barrel `@gregoiref/ts-utils` remains unchanged.

  Also harden `deepMerge` against prototype pollution by skipping reserved keys (`__proto__`, `constructor`, `prototype`).
