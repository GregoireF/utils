/**
 * @typedef {Object} ChangelogEntry
 * @property {string | [string, Record<string, unknown>]} changelog
 */

/**
 * @typedef {Object} ChangesetsConfig
 * @property {string} $schema
 * @property {string | [string, Record<string, unknown>]} changelog
 * @property {boolean} commit
 * @property {string[]} fixed
 * @property {string[]} linked
 * @property {"public"|"restricted"} access
 * @property {string} baseBranch
 * @property {"minor"|"patch"} updateInternalDependencies
 * @property {string[]} ignore
 */

/**
 * Creates a Changesets configuration object.
 * Write the result to `.changeset/config.json` in your project.
 *
 * @param {{ repo?: string } & Partial<ChangesetsConfig>} [overrides]
 * @returns {ChangesetsConfig}
 *
 * @example
 * // .changeset/config.json — generate via: node scripts/init-changesets.mjs
 * import { createConfig } from '@gregoiref/changeset-config'
 * export default createConfig({ repo: 'owner/repo' })
 */
export function createConfig({ repo, ...overrides } = {}) {
  const changelog = repo
    ? ['@gregoiref/changeset-config/changelog', { repo }]
    : '@gregoiref/changeset-config/changelog'

  return {
    $schema: 'https://unpkg.com/@changesets/config/schema.json',
    changelog,
    commit: false,
    fixed: [],
    linked: [],
    access: 'public',
    baseBranch: 'main',
    updateInternalDependencies: 'patch',
    ignore: [],
    ...overrides,
  }
}
