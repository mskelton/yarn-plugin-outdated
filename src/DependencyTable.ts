import { Configuration, formatUtils } from "@yarnpkg/core"
import * as semver from "semver"
import { OutdatedDependency } from "./types"

const columns = [
  "name",
  "current",
  "wanted",
  "latest",
  "workspace",
  "type",
] as const

type TableColumn = typeof columns[number]

export class DependencyTable {
  private sizes: Record<TableColumn, number> = null!
  private headers: Record<TableColumn, string> = {
    current: "Current",
    latest: "Latest",
    name: "Package",
    type: "Package Type",
    wanted: "Wanted",
    workspace: "Workspace",
  }

  constructor(
    private configuration: Configuration,
    private dependencies: OutdatedDependency[],
    private extraColumns: Partial<Record<TableColumn, boolean>>
  ) {}

  print() {
    this.sizes = this.getColumnSizes()
    this.printHeader()

    this.dependencies.forEach((dep) => {
      const current = semver.parse(dep.current)!
      const latest = semver.parse(dep.latest)!

      const color =
        latest.major > current.major
          ? "red"
          : latest.minor > current.minor
          ? "yellow"
          : "green"

      this.printRow({
        current: dep.current.padEnd(this.sizes.current),
        latest: dep.latest.padEnd(this.sizes.latest),
        name: formatUtils.pretty(
          this.configuration,
          dep.name.padEnd(this.sizes.name),
          color
        ),
        type: dep.type.padEnd(this.sizes.type),
        wanted: dep.wanted?.padEnd(this.sizes.wanted),
        workspace: dep.workspace?.padEnd(this.sizes.workspace),
      })
    })
  }

  private getColumnSizes(): Record<TableColumn, number> {
    const sizes = {
      current: this.headers.current.length,
      latest: this.headers.latest.length,
      name: this.headers.name.length,
      type: this.headers.type.length,
      wanted: this.headers.wanted.length,
      workspace: this.headers.workspace.length,
    }

    for (const dependency of this.dependencies) {
      for (const [key, value] of Object.entries(dependency)) {
        const acc = sizes[key as TableColumn]
        const cur = (value || "").length

        sizes[key as TableColumn] = acc > cur ? acc : cur
      }
    }

    return sizes
  }

  private formatColumnHeader(column: TableColumn) {
    return formatUtils.pretty(
      this.configuration,
      this.headers[column].padEnd(this.sizes[column]),
      "bold"
    )
  }

  private printHeader() {
    this.printRow({
      current: this.formatColumnHeader("current"),
      latest: this.formatColumnHeader("latest"),
      name: this.formatColumnHeader("name"),
      type: this.formatColumnHeader("type"),
      wanted: this.formatColumnHeader("wanted"),
      workspace: this.formatColumnHeader("workspace"),
    })
  }

  private printRow(row: Record<TableColumn, string | undefined>) {
    const output = columns
      .filter((column) => this.extraColumns[column] ?? true)
      .map((column) => row[column])
      .join("   ")

    console.log(output)
  }
}
