'use strict'

/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      // Accepts both: "✨ feat(scope): message"  and  "feat(scope): message"
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
        'security',
        'revert',
        'wip',
      ],
    ],
    // Disable subject-case: emoji prefix breaks uppercase detection
    'subject-case': [0],
    // 100 chars aligns with @commitlint/config-conventional and Angular style guide
    'header-max-length': [2, 'always', 100],
    // 100 chars per line in body (conventional default, readable in GitHub diff view)
    'body-max-line-length': [2, 'always', 100],
    // Same limit for footer (BREAKING CHANGE, issue refs)
    'footer-max-line-length': [2, 'always', 100],
  },
}
