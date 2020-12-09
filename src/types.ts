import { Descriptor, Workspace } from "@yarnpkg/core"

export const dependencyTypes = ["dependencies", "devDependencies"]
export type DependencyType = typeof dependencyTypes[number]

export interface DependencyInfo {
  descriptor: Descriptor
  dependencyType: DependencyType
  workspace: Workspace
}

export interface OutdatedDependency {
  name: string
  current: string
  latest: string
  type: DependencyType
}
