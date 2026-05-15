export interface ChangesetsConfig {
  $schema: string
  changelog: string | [string, Record<string, unknown>]
  commit: boolean
  fixed: string[]
  linked: string[]
  access: 'public' | 'restricted'
  baseBranch: string
  updateInternalDependencies: 'minor' | 'patch'
  ignore: string[]
  [key: string]: unknown
}

export interface CreateConfigOptions extends Partial<ChangesetsConfig> {
  /** GitHub repository slug (e.g. "owner/repo"). Passed to the changelog formatter for context. */
  repo?: string
}

/**
 * Creates a Changesets configuration object.
 * Write the result to `.changeset/config.json` in your project.
 */
export declare function createConfig(overrides?: CreateConfigOptions): ChangesetsConfig
