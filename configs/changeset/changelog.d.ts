export declare function getReleaseLine(
  changeset: { summary: string; id: string },
  type: 'major' | 'minor' | 'patch',
  options?: Record<string, unknown>
): Promise<string>

export declare function getDependencyReleaseLine(
  changesets: Array<{ summary: string; id: string }>,
  dependenciesUpdated: Array<{ name: string; newVersion: string }>,
  options?: Record<string, unknown>
): Promise<string | null>
