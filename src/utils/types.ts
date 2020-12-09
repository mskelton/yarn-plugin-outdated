export interface DependencyInfo {
  name: string
  current: string
  latest: string
  type: "dependencies" | "devDependencies"
}
