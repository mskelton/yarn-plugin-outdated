import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli"
import {
  Cache,
  Configuration,
  FormatType,
  formatUtils,
  MessageName,
  Project,
  Report,
  StreamReport,
  structUtils,
  Workspace,
} from "@yarnpkg/core"
import { Command, Usage, UsageError } from "clipanion"
import * as micromatch from "micromatch"
import * as semver from "semver"
import { DependencyFetcher } from "./DependencyFetcher"
import { DependencyTable } from "./DependencyTable"
import { DependencyInfo, OutdatedDependency } from "./types"
import { excludeFalsey, parseVersion } from "./utils"

export class OutdatedCommand extends BaseCommand {
  static usage: Usage = Command.Usage({
    description: "view outdated dependencies",
    details: `
      This command finds outdated dependencies in a project and prints the result in a table or JSON format.

      This command accepts glob patterns as arguments to filter the output. Make sure to escape the patterns, to prevent your own shell from trying to expand them.
    `,
    examples: [
      ["View outdated dependencies", "yarn outdated"],
      [
        "View outdated dependencies with the `@babel` scope",
        "yarn outdated '@babel/*'",
      ],
      [
        "Check for outdated dependencies and return exit code 1 if outdated dependencies are found",
        "yarn outdated --check",
      ],
    ],
  })

  @Command.Rest()
  patterns: string[] = []

  @Command.Boolean("-a,--all", {
    description: "Include outdated dependencies from all workspaces",
  })
  all = false

  @Command.Boolean("-c,--check", {
    description: `Exit with exit code 1 when outdated dependencies are found`,
  })
  check = false

  @Command.Boolean("--json", { description: "Format the output as JSON" })
  json = false

  @Command.Path("outdated")
  async execute() {
    const {
      cache,
      configuration,
      project,
      workspace,
    } = await this.loadProject()

    const fetcher = new DependencyFetcher(project, workspace, cache)
    const workspaces = this.getWorkspaces(project, workspace)
    const dependencies = this.getDependencies(configuration, workspaces)

    if (this.json) {
      const outdated = await this.getOutdatedDependencies(fetcher, dependencies)
      this.context.stdout.write(JSON.stringify(outdated) + "\n")
      return
    }

    await StreamReport.start(
      { configuration, stdout: this.context.stdout },
      async (report) => {
        await this.checkOutdatedDependencies(
          configuration,
          dependencies,
          fetcher,
          report
        )
      }
    )
  }

  async checkOutdatedDependencies(
    configuration: Configuration,
    dependencies: DependencyInfo[],
    fetcher: DependencyFetcher,
    report: StreamReport
  ) {
    let outdated: OutdatedDependency[] = null!

    await report.startTimerPromise(
      "Checking for outdated dependencies",
      async () => {
        const count = dependencies.length
        const progress = StreamReport.progressViaCounter(count)
        report.reportProgress(progress)

        outdated = await this.getOutdatedDependencies(
          fetcher,
          dependencies,
          progress
        )
      }
    )

    report.reportSeparator()

    if (outdated.length) {
      const table = new DependencyTable(report, configuration, outdated, {
        workspace: this.all,
      })

      table.print()
      report.reportSeparator()
      this.reportError(report, outdated.length)
    } else {
      this.printUpToDate(configuration, report)
    }
  }

  /**
   * Loads the project and current workspace.
   */
  async loadProject() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    )

    const [cache, { project, workspace }] = await Promise.all([
      Cache.find(configuration),
      Project.find(configuration, this.context.cwd),
    ])

    if (!workspace) {
      throw new WorkspaceRequiredError(project.cwd, this.context.cwd)
    }

    return {
      cache,
      configuration,
      project,
      workspace,
    }
  }

  /**
   * If the user passed the `--all` CLI flag, then we will load dependencies
   * from all workspaces instead of just the current workspace.
   */
  getWorkspaces(project: Project, workspace: Workspace) {
    return this.all ? project.workspaces : [workspace]
  }

  /**
   * Collect all dependencies and devDependencies from all workspaces into an
   * array which we can process more easily.
   */
  getDependencies(configuration: Configuration, workspaces: Workspace[]) {
    const dependencies: DependencyInfo[] = []
    const dependencyTypes = ["dependencies", "devDependencies"] as const

    for (const workspace of workspaces) {
      for (const dependencyType of dependencyTypes) {
        for (const descriptor of workspace.manifest[dependencyType].values()) {
          // Only include valid semver ranges. Non-semver ranges such as tags
          // (e.g. `next`) or protocols (e.g. `workspace:*`) should be ignored.
          if (semver.coerce(descriptor.range)) {
            dependencies.push({
              dependencyType,
              descriptor,
              name: structUtils.stringifyIdent(descriptor),
              workspace,
            })
          }
        }
      }
    }

    // If the user didn't provide a filter pattern, we don't need to do any
    // filtering so we can return early.
    if (!this.patterns.length) {
      return dependencies
    }

    // Only include the dependencies matching the pattern provided by the user.
    const filteredDependencies = dependencies.filter(({ name }) =>
      micromatch.isMatch(name, this.patterns)
    )

    // If ther user entered a pattern that doesn't match any dependencies, they
    // likely made a mistake. If we simply return an empty array they may
    // incorrectly think that no packages are outdated. Instead, we can throw
    // an error to warn them that their pattern didn't match any dependencies.
    if (!filteredDependencies.length) {
      throw new UsageError(
        `Pattern ${formatUtils.prettyList(
          configuration,
          this.patterns,
          FormatType.CODE
        )} doesn't match any packages referenced by any workspace`
      )
    }

    return filteredDependencies
  }

  /**
   * Iterates through the dependencies to find the outdated dependencies and
   * sort them in ascending order.
   */
  async getOutdatedDependencies(
    fetcher: DependencyFetcher,
    dependencies: DependencyInfo[],
    progress?: ReturnType<typeof Report["progressViaCounter"]>
  ): Promise<OutdatedDependency[]> {
    const outdated = dependencies.map(
      async ({ dependencyType, descriptor, name, workspace }) => {
        const latest = await fetcher.fetch(descriptor, "latest")
        const current = parseVersion(descriptor.range)

        // JSON reports don't use progress, so this only applies for non-JSON
        // cases.
        progress?.tick()

        if (current !== latest) {
          return {
            current,
            latest,
            name,
            type: dependencyType,
            workspace: this.all ? this.getWorkspaceName(workspace) : undefined,
          } as OutdatedDependency
        }
      }
    )

    return (await Promise.all(outdated))
      .filter(excludeFalsey)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  getWorkspaceName(workspace: Workspace) {
    return workspace.manifest.name
      ? structUtils.stringifyIdent(workspace.manifest.name)
      : workspace.computeCandidateName()
  }

  reportError(report: StreamReport, count: number) {
    if (!this.check) return

    report.reportError(
      MessageName.EXCEPTION,
      count === 1
        ? "1 dependency is out of date"
        : `${count} dependencies are out of date`
    )
  }

  printUpToDate(configuration: Configuration, report: StreamReport) {
    const message = "✨ All your dependencies are up to date!"

    report.reportInfo(
      MessageName.UNNAMED,
      formatUtils.pretty(configuration, message, "green")
    )
  }
}
