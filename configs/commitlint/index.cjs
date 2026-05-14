'use strict'

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // Accepts: ✨ feat(scope): message  OR  feat(scope): message
      headerPattern: /^(?:\S+\s)?(\w+)(?:\(([^)]+)\))?(!)?: (.+)$/u,
      headerCorrespondence: ['type', 'scope', 'breaking', 'subject'],
    },
  },
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
        'wip',
      ],
    ],
    'subject-case': [0],
    'header-max-length': [2, 'always', 120],
    'body-max-line-length': [2, 'always', 200],
  },
}
