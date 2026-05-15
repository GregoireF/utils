'use strict'

const base = require('@gregoiref/cz-config')

/** @type {import('cz-git').UserConfig} */
module.exports = {
  ...base,
  // Expose footer/issue linking for this monorepo
  skipQuestions: [],
  scopes: [
    // Packages
    { value: 'result',        name: 'result:         @gregoiref/result' },
    { value: 'ts-utils',      name: 'ts-utils:       @gregoiref/ts-utils' },
    { value: 'env-validator', name: 'env-validator:  @gregoiref/env-validator' },
    { value: 'http-client',   name: 'http-client:    @gregoiref/http-client' },
    { value: 'logger',        name: 'logger:         @gregoiref/logger' },
    { value: 'date',          name: 'date:           @gregoiref/date' },
    // Configs
    { value: 'tsconfig',      name: 'tsconfig:       @gregoiref/tsconfig' },
    { value: 'biome',         name: 'biome:          @gregoiref/biome-config' },
    { value: 'vitest',        name: 'vitest:         @gregoiref/vitest-config' },
    { value: 'commitlint',    name: 'commitlint:     @gregoiref/commitlint-config' },
    { value: 'cz',            name: 'cz:             @gregoiref/cz-config' },
    { value: 'changeset',     name: 'changeset:      @gregoiref/changeset-config' },
    // Cross-cutting
    { value: 'ci',            name: 'ci:             GitHub Actions / workflows' },
    { value: 'deps',          name: 'deps:           Dependency updates' },
    { value: 'docs',          name: 'docs:           Documentation (wiki, guides)' },
    { value: 'release',       name: 'release:        Versioning / release process' },
  ],
}
