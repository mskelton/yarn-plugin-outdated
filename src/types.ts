export interface OutdatedDependency {
  name: string
  current: string
  latest: string
  type: "dependencies" | "devDependencies"
}
