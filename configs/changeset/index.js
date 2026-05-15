/**
 * @typedef {Object} ChangesetsConfig
 * @property {string} $schema
 * @property {string} changelog
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
 * @param {Partial<ChangesetsConfig>} [overrides]
 * @returns {ChangesetsConfig}
 */
export function createConfig(overrides = {}) {
  return {
    $schema: "https://unpkg.com/@changesets/config/schema.json",
    changelog: "@changesets/cli/changelog",
    commit: false,
    fixed: [],
    linked: [],
    access: "public",
    baseBranch: "main",
    updateInternalDependencies: "patch",
    ignore: [],
    ...overrides,
  };
}
