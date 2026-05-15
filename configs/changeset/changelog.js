/**
 * Custom Changesets changelog formatter.
 *
 * Adds emoji prefixes to CHANGELOG entries based on bump type:
 *   🚀 major — breaking change
 *   ✨ minor — new feature
 *   🐛 patch — bug fix or internal change
 *
 * Usage in .changeset/config.json:
 *   "changelog": ["@gregoiref/changeset-config/changelog", {}]
 */

const EMOJI = {
  major: '🚀',
  minor: '✨',
  patch: '🐛',
}

/**
 * @param {{ summary: string; id: string }} changeset
 * @param {'major' | 'minor' | 'patch'} type
 * @returns {Promise<string>}
 */
export async function getReleaseLine(changeset, type) {
  const emoji = EMOJI[type] ?? '📦'
  const [firstLine, ...rest] = changeset.summary
    .split('\n')
    .map(l => l.trimEnd())

  const header = `- ${emoji} ${firstLine}`
  if (rest.filter(Boolean).length === 0) return header

  const body = rest.map(l => (l.trim() === '' ? '' : `  ${l}`)).join('\n')
  return `${header}\n${body}`
}

/**
 * @param {Array<{ summary: string; id: string }>} _changesets
 * @param {Array<{ name: string; newVersion: string }>} dependenciesUpdated
 * @returns {Promise<string | null>}
 */
export async function getDependencyReleaseLine(_changesets, dependenciesUpdated) {
  if (dependenciesUpdated.length === 0) return null

  const lines = dependenciesUpdated
    .map(dep => `  - \`${dep.name}@${dep.newVersion}\``)
    .join('\n')

  return `- 📦 Updated dependencies:\n${lines}`
}
