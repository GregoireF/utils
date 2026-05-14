/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@gregoiref/commitlint-config'],
  parserPreset: {
    parserOpts: {
      // Supports: ✨ feat(scope): message  OR  feat(scope): message
      headerPattern: /^(?:\S+\s)?(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/u,
      headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
    },
  },
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'tsconfig',
        'biome',
        'vitest',
        'commitlint',
        'cz',
        'ts-utils',
        'env-validator',
        'http-client',
        'design-tokens',
        'logger',
        'date',
        'result',
        'ci',
        'deps',
        'release',
      ],
    ],
  },
}
