import { CommandContext, Configuration, formatUtils } from "@yarnpkg/core"
import * as semver from "semver"
import { OutdatedDependency } from "./types"

const semverRegex = /^([0-9]+\.)([0-9]+\.)(.+)$/
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
    private context: CommandContext,
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
        latest: this.formatVersion(dependency, "latest", color),
        name: this.applyColor(dependency.name.padEnd(this.sizes.name), color),
        type: dependency.type.padEnd(this.sizes.type),
        workspace: dependency.workspace?.padEnd(this.sizes.workspace),
      })
    })
  }

  private applyColor(value: string, color: string) {
    return formatUtils.pretty(this.configuration, value, color)
  }

  private formatVersion(
    dependency: OutdatedDependency,
    column: TableColumn,
    color: string
  ) {
    const value = dependency[column]!.padEnd(this.sizes[column])
    const matches = value.match(semverRegex)

    if (!matches) {
      return value
    }

    const index = ["red", "yellow", "green"].indexOf(color) + 1
    const start = matches.slice(1, index).join("")
    const end = matches.slice(index).join("")

    return (
      start +
      formatUtils.pretty(
        this.configuration,
        this.applyColor(end, color),
        "bold"
      )
    )
  }

  private getDiffColor(dependency: OutdatedDependency) {
    const current = semver.coerce(dependency.current)!
    const latest = semver.coerce(dependency.latest)!

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

    this.context.stdout.write(output + "\n")
  }
}
