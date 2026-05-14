'use strict'

const base = require('@gregoiref/cz-config')

/** @type {import('cz-git').UserConfig} */
module.exports = {
  ...base,
  messages: {
    ...base.messages,
    type: 'Sélectionne le type de changement :',
    scope: 'Quel package est concerné ? (optionnel)',
    customScope: 'Quel package est concerné ?',
    subject: 'Description courte et impérative :\n',
    confirmCommit: 'Confirmer ce commit ?',
  },
  scopes: [
    { value: 'tsconfig', name: 'tsconfig:     @utils/tsconfig' },
    { value: 'biome', name: 'biome:        @utils/biome' },
    { value: 'vitest', name: 'vitest:       @utils/vitest' },
    { value: 'commitlint', name: 'commitlint:   @gregoiref/commitlint-config' },
    { value: 'cz', name: 'cz:           @gregoiref/cz-config' },
    { value: 'ts-utils', name: 'ts-utils:     @gregoiref/ts-utils' },
    { value: 'env-validator', name: 'env-validator: @gregoiref/env-validator' },
    { value: 'http-client', name: 'http-client:  @gregoiref/http-client' },
    { value: 'design-tokens', name: 'design-tokens: @gregoiref/design-tokens' },
    { value: 'logger', name: 'logger:       @gregoiref/logger' },
    { value: 'date', name: 'date:         @gregoiref/date' },
    { value: 'result', name: 'result:       @gregoiref/result' },
    { value: 'ci', name: 'ci:           GitHub Actions / workflows' },
    { value: 'deps', name: 'deps:         Mise à jour de dépendances' },
    { value: 'release', name: 'release:      Versioning / release' },
  ],
}
