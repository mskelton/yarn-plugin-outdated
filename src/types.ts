import { Package, Workspace } from "@yarnpkg/core"

export const dependencyTypes = ["dependencies", "devDependencies"] as const
export type DependencyType = typeof dependencyTypes[number]

export interface DependencyInfo {
  name: string
  pkg: Package
  dependencyType: DependencyType
  workspace: Workspace
}

export interface OutdatedDependency {
  name: string
  current: string
  latest: string
  type: DependencyType
  url?: string
  workspace?: string
}
