import { Descriptor, Package, Workspace } from "@yarnpkg/core"

export const dependencyTypes = ["dependencies", "devDependencies"] as const
export type DependencyType = typeof dependencyTypes[number]

export const severities = ["major", "minor", "patch"] as const
export type Severity = typeof severities[number]

export interface DependencyInfo {
  dependencyType: DependencyType
  descriptor: Descriptor
  name: string
  pkg: Package
  workspace: Workspace
}

export interface OutdatedDependency {
  current: string
  latest: string
  name: string
  range?: string
  severity: {
    latest: Severity
    range?: Severity
  }
  type: DependencyType
  url?: string
  workspace?: string
}
