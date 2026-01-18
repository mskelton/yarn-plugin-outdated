import { Configuration, formatUtils } from "@yarnpkg/core"
import { OutdatedDependency, Severity } from "./types"

const semverRegex = /^([0-9]+\.)([0-9]+\.)(.+)$/
const columns = [
  "name",
  "current",
  "range",
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
    name: "Package",
    range: "Range",
    type: "Package Type",
    url: "URL",
    workspace: "Workspace",
  }

  constructor(
    private format: "markdown" | "text",
    private writer: (row: string) => void,
    private configuration: Configuration,
    private dependencies: OutdatedDependency[],
    private extraColumns: Partial<Record<TableColumn, boolean>>
  ) {}

  print() {
    this.sizes = this.getColumnSizes()
    this.printHeader()

    this.dependencies.forEach((dependency) => {
      const color = this.getDiffColor(dependency.severity.latest)
      const rangeColor = this.getDiffColor(dependency.severity.range)

      this.printRow({
        current: dependency.current.padEnd(this.sizes.current),
        latest: this.formatVersion(dependency, "latest", color),
        name: this.applyColor(dependency.name.padEnd(this.sizes.name), color),
        range: this.formatVersion(dependency, "range", rangeColor),
        type: dependency.type.padEnd(this.sizes.type),
        url: dependency.url?.padEnd(this.sizes.url),
        workspace: dependency.workspace?.padEnd(this.sizes.workspace),
      })
    })
  }

  private applyColor(value: string, color: string | null) {
    return color ? formatUtils.pretty(this.configuration, value, color) : value
  }

  private formatVersion(
    dependency: OutdatedDependency,
    column: TableColumn,
    color: string | null
  ) {
    const value = dependency[column]?.padEnd(this.sizes[column])
    if (!value) return

    const matches = value.match(semverRegex)
    if (!matches || !color) return value

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

  private getDiffColor(severity: Severity) {
    return severity
      ? { major: "red", minor: "yellow", patch: "green" }[severity]
      : null
  }

  private getColumnSizes(): Record<TableColumn, number> {
    const sizes = columns.reduce(
      (acc, column) => ({ ...acc, [column]: this.headers[column].length }),
      {} as Record<TableColumn, number>
    )

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
      range: this.formatColumnHeader("range"),
      type: this.formatColumnHeader("type"),
      url: this.formatColumnHeader("url"),
      workspace: this.formatColumnHeader("workspace"),
    })

    if (this.format === "markdown") {
      this.printRow(
        (Object.keys(this.sizes) as TableColumn[]).reduce(
          (acc, key) => ({ ...acc, [key]: "".padEnd(this.sizes[key], "-") }),
          {} as Record<TableColumn, string>
        )
      )
    }
  }

  private printRow(row: Record<TableColumn, string | undefined>) {
    const isMarkdown = this.format === "markdown"
    const output = columns
      .filter((column) => this.extraColumns[column] ?? true)
      .map((column) => row[column])
      .join(isMarkdown ? " | " : "   ")

    this.writer(isMarkdown ? `| ${output} |` : output.trim())
  }
}
