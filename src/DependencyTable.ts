import { Configuration, formatUtils } from "@yarnpkg/core"
import * as semver from "semver"
import { OutdatedDependency } from "./types"

const columns = ["name", "current", "latest", "workspace", "type"] as const

type TableColumn = typeof columns[number]

export class DependencyTable {
  private sizes: Record<TableColumn, number> = null!
  private headers: Record<TableColumn, string> = {
    current: "Current",
    latest: "Latest",
    name: "Package",
    type: "Package Type",
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

    this.dependencies.forEach((dependency) => {
      const color = this.getDiffColor(dependency)

      this.printRow({
        current: dependency.current.padEnd(this.sizes.current),
        latest: dependency.latest.padEnd(this.sizes.latest),
        name: formatUtils.pretty(
          this.configuration,
          dependency.name.padEnd(this.sizes.name),
          color
        ),
        type: dependency.type.padEnd(this.sizes.type),
        workspace: dependency.workspace?.padEnd(this.sizes.workspace),
      })
    })
  }

  getDiffColor(dependency: OutdatedDependency) {
    const current = semver.parse(dependency.current)!
    const latest = semver.parse(dependency.latest)!

    return latest.major > current.major
      ? "red"
      : latest.minor > current.minor
      ? "yellow"
      : "green"
  }

  private getColumnSizes(): Record<TableColumn, number> {
    const sizes = {
      current: this.headers.current.length,
      latest: this.headers.latest.length,
      name: this.headers.name.length,
      type: this.headers.type.length,
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
