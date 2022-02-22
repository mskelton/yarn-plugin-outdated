import { Configuration, formatUtils, MessageName, Report } from "@yarnpkg/core"
import { OutdatedDependency } from "./types"

const semverRegex = /^([0-9]+\.)([0-9]+\.)(.+)$/
const columns = [
  "name",
  "current",
  "patch",
  "minor",
  "latest",
  "workspace",
  "type",
  "url",
] as const

type TableColumn = typeof columns[number]

export class DependencyTable {
  private sizes: Record<TableColumn, number> = null!
  private headers: Record<TableColumn, string> = {
    current: "Current",
    latest: "Latest",
    minor: "Minor",
    name: "Package",
    patch: "Patch",
    type: "Package Type",
    url: "URL",
    workspace: "Workspace",
  }

  constructor(
    private report: Report,
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
        minor: this.formatVersion(dependency, "minor", color),
        name: this.applyColor(dependency.name.padEnd(this.sizes.name), color),
        patch: this.formatVersion(dependency, "patch", color),
        type: dependency.type.padEnd(this.sizes.type),
        url: dependency.url?.padEnd(this.sizes.url),
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
    const colors = { major: "red", minor: "yellow", patch: "green" }
    return colors[dependency.severity]
  }

  private getColumnSizes(): Record<TableColumn, number> {
    const sizes = {
      current: this.headers.current.length,
      latest: this.headers.latest.length,
      minor: this.headers.minor.length,
      name: this.headers.name.length,
      patch: this.headers.patch.length,
      type: this.headers.type.length,
      url: this.headers.url.length,
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
      minor: this.formatColumnHeader("minor"),
      name: this.formatColumnHeader("name"),
      patch: this.formatColumnHeader("patch"),
      type: this.formatColumnHeader("type"),
      url: this.formatColumnHeader("url"),
      workspace: this.formatColumnHeader("workspace"),
    })
  }

  private printRow(row: Record<TableColumn, string | undefined>) {
    const output = columns
      .filter((column) => this.extraColumns[column] ?? true)
      .map((column) => row[column])
      .join("   ")
      .trim()

    this.report.reportInfo(MessageName.UNNAMED, output)
  }
}
