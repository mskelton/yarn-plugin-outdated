import { Configuration, formatUtils } from "@yarnpkg/core"
import * as semver from "semver"
import { DependencyInfo } from "./types"

const columns = ["name", "current", "latest", "type"] as const

export type TableColumn = typeof columns[number]

export const headers: Record<TableColumn, string> = {
  current: "Current",
  latest: "Latest",
  name: "Package",
  type: "Package Type",
}

// Iterates through the dependencies to determine the necessary size
// of each column.
function getColumnSizes(
  dependencies: DependencyInfo[]
): Record<TableColumn, number> {
  const sizes = {
    current: headers.current.length,
    latest: headers.latest.length,
    name: headers.name.length,
    type: headers.type.length,
  }

  for (const dependency of dependencies) {
    for (const [key, value] of Object.entries(dependency)) {
      const acc = sizes[key as TableColumn]
      const cur = value.length

      sizes[key as TableColumn] = acc > cur ? acc : cur
    }
  }

  return sizes
}

function printHeader(
  configuration: Configuration,
  sizes: Record<TableColumn, number>
) {
  const format = (key: TableColumn) =>
    formatUtils.pretty(configuration, headers[key].padEnd(sizes[key]), "bold")

  printRow({
    current: format("current"),
    latest: format("latest"),
    name: format("name"),
    type: format("type"),
  })
}

function printRow(row: Record<TableColumn, string>) {
  console.log(columns.map((column) => row[column]).join("   "))
}

export function printTable(
  configuration: Configuration,
  dependencies: DependencyInfo[]
) {
  const sizes = getColumnSizes(dependencies)
  printHeader(configuration, sizes)

  dependencies.forEach((dep) => {
    const current = semver.parse(dep.current)!
    const latest = semver.parse(dep.latest)!

    const color =
      latest.major > current.major
        ? "red"
        : latest.minor > current.minor
        ? "yellow"
        : "green"

    printRow({
      current: dep.current.padEnd(sizes.current),
      latest: dep.latest.padEnd(sizes.latest),
      name: formatUtils.pretty(
        configuration,
        dep.name.padEnd(sizes.name),
        color
      ),
      type: dep.type.padEnd(sizes.type),
    })
  })
}
