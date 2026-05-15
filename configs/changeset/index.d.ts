export interface ChangesetsConfig {
  $schema: string;
  changelog: string;
  commit: boolean;
  fixed: string[];
  linked: string[];
  access: "public" | "restricted";
  baseBranch: string;
  updateInternalDependencies: "minor" | "patch";
  ignore: string[];
  [key: string]: unknown;
}

/**
 * Creates a Changesets configuration object.
 * Write the result to `.changeset/config.json` in your project.
 */
export declare function createConfig(overrides?: Partial<ChangesetsConfig>): ChangesetsConfig;
