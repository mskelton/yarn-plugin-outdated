import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli"
import {
  Cache,
  Configuration,
  Descriptor,
  formatUtils,
  Locator,
  MessageName,
  Project,
  Report,
  StreamReport,
  structUtils,
  Workspace,
} from "@yarnpkg/core"
import { Command, Option, Usage, UsageError } from "clipanion"
import micromatch from "micromatch"
import path from "path"
import semver from "semver"
import t from "typanion"
import { DependencyFetcher } from "./DependencyFetcher"
import { DependencyTable } from "./DependencyTable"
import {
  DependencyInfo,
  dependencyTypes,
  formats,
  OutdatedDependency,
  severities,
  Severity,
} from "./types"
import { isVersionOutdated, truthy } from "./utils"

const UP_TO_DATE_MESSAGE = "✨ All your dependencies are up to date!"

export class OutdatedCommand extends BaseCommand {
  static paths = [["outdated"]]

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
        "Filter results to only include devDependencies",
        "yarn outdated --type devDependencies",
      ],
      [
        "Filter results to only include major version updates",
        "yarn outdated --severity major",
      ],
    ],
  })

  patterns = Option.Rest()

  workspace = Option.Array("-w,--workspace", {
    description: `Only search for dependencies in the specified workspaces. If no workspaces are specified, only searches for outdated dependencies in the current workspace.`,
    validator: t.isArray(t.isString()),
  })

  check = Option.Boolean("-c,--check", false, {
    description: "Exit with exit code 1 when outdated dependencies are found",
  })

  format = Option.String("--format", "text", {
    description: "The format of the output (text|json|markdown)",
    validator: t.isEnum(formats),
  })

  json = Option.Boolean("--json", false, {
    description: "Format the output as JSON",
  })

  severity = Option.Array("-s,--severity", {
    description: "Filter results based on the severity of the update",
    validator: t.isArray(t.isEnum(severities)),
  })

  type = Option.String("-t,--type", {
    description: "Filter results based on the dependency type",
    validator: t.isEnum(dependencyTypes),
  })

  _includeURL = Option.Boolean("--url", {
    description: "Include the homepage URL of each package in the output",
  })

  includeRange = Option.Boolean("--range", false, {
    description: `Include the latest version of the package which satisfies the current range specified in the manifest.`,
  })

  async execute() {
    const { cache, configuration, project, workspace } =
      await this.loadProject()

    const fetcher = new DependencyFetcher(
      configuration,
      project,
      workspace,
      cache
    )
    const workspaces = this.getWorkspaces(project)
    const dependencies = this.getDependencies(configuration, workspaces)

    if (this.format !== "text" || this.json) {
      const outdated = await this.getOutdatedDependencies(
        configuration,
        project,
        fetcher,
        dependencies
      )

      if (this.format === "json" || this.json) {
        this.writeJson(outdated)
      } else {
        this.writeMarkdown(configuration, project, outdated)
      }

      return this.check && outdated.length ? 1 : 0
    }

    const report = await StreamReport.start(
      { configuration, stdout: this.context.stdout },
      async (report) => {
        await this.checkOutdatedDependencies(
          configuration,
          project,
          dependencies,
          fetcher,
          report
        )
      }
    )

    return report.exitCode()
  }

  includeURL(configuration: Configuration) {
    return this._includeURL ?? configuration.get("outdatedIncludeUrl")
  }

  writeJson(outdated: OutdatedDependency[]) {
    const json = outdated.map((dep) => ({
      ...dep,
      severity: dep.severity.latest,
    }))

    this.context.stdout.write(JSON.stringify(json) + "\n")
  }

  writeMarkdown(
    configuration: Configuration,
    project: Project,
    outdated: OutdatedDependency[]
  ) {
    if (!outdated.length) {
      this.context.stdout.write(UP_TO_DATE_MESSAGE + "\n")
      return
    }

    const table = new DependencyTable(
      "markdown",
      (line) => this.context.stdout.write(line + "\n"),
      configuration,
      outdated,
      {
        range: this.includeRange,
        url: this.includeURL(configuration),
        workspace: this.includeWorkspace(project),
      }
    )
    table.print()
  }

  async checkOutdatedDependencies(
    configuration: Configuration,
    project: Project,
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
          configuration,
          project,
          fetcher,
          dependencies,
          progress
        )
      }
    )

    report.reportSeparator()

    if (outdated.length) {
      const table = new DependencyTable(
        "text",
        (row) => report.reportInfo(MessageName.UNNAMED, row),
        configuration,
        outdated,
        {
          range: this.includeRange,
          url: this.includeURL(configuration),
          workspace: this.includeWorkspace(project),
        }
      )

      table.print()
      report.reportSeparator()
      this.printOutdatedCount(report, outdated.length)
    } else {
      report.reportInfo(
        MessageName.UNNAMED,
        formatUtils.pretty(configuration, UP_TO_DATE_MESSAGE, "green")
      )
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

    // Certain project fields (e.g. storedPackages) can only be accessed after
    // restoring the install state of the project.
    await project.restoreInstallState()

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
   * If the user passed the `--workspace` CLI flag, then we filter the
   * workspaces.
   */
  getWorkspaces(project: Project) {
    const patterns = this.workspace

    return !patterns
      ? project.workspaces
      : patterns[0] === "."
      ? project.workspaces.filter((w) => w.cwd === this.context.cwd)
      : project.workspaces.filter((w) => {
          // For each pattern provided by the user, we include a copy of the
          // pattern with the current working directory prepended to allow
          // easily searching by relative paths.
          const globs = [
            ...patterns,
            ...patterns.map((p) => path.join(this.context.cwd, p)),
          ]

          // The globs are matched against the workspace name and working
          // directory to allow both directory and name filtering.
          return micromatch.some([this.getWorkspaceName(w), w.cwd], globs)
        })
  }

  /**
   * Whether to include the workspace column in the output.
   */
  includeWorkspace(project: Project) {
    return project.workspaces.length > 1
  }

  /**
   * Get the dependency types that should be included in the output.
   */
  get dependencyTypes() {
    return this.type ? [this.type] : dependencyTypes
  }

  /**
   * Collect all dependencies and devDependencies from all workspaces into an
   * array which we can process more easily.
   */
  getDependencies(configuration: Configuration, workspaces: Workspace[]) {
    const dependencies: DependencyInfo[] = []

    for (const workspace of workspaces) {
      const { anchoredLocator, project } = workspace

      // First, we load the packages for the given workspace
      const root = project.storedPackages.get(anchoredLocator.locatorHash)
      if (!root) this.throw(configuration, anchoredLocator)

      for (const dependencyType of this.dependencyTypes) {
        for (const descriptor of workspace.manifest[dependencyType].values()) {
          const { range } = descriptor

          // Only include dependencies that are semver-compatible, package
          // aliases (npm protocol), or patches.
          if (range.includes(":") && !/(npm|patch):/.test(range)) {
            continue
          }

          // To find the resolution for a dependency, we first need to convert
          // the package descriptor in the manifest to the package descriptor
          // in the project as the descriptor hash in the manifest differs
          // from the descriptor hash in the project.
          const dependency = root.dependencies.get(descriptor.identHash)
          if (!dependency) this.throw(configuration, descriptor)

          // For each dependency, we lookup the stored resolution to get the
          // locator hash.
          const res = project.storedResolutions.get(dependency.descriptorHash)
          if (!res) this.throw(configuration, dependency)

          // Finally, we can use the locator hash to lookup the stored package
          // in the lockfile.
          const pkg = project.storedPackages.get(res)
          if (!pkg) this.throw(configuration, dependency)

          // If the dependency is a workspace, then we don't need to check
          // if it is outdated. These type of packages tend to be versioned with
          // a tool like Changesets or Lerna; or they are private.
          if (workspace.project.tryWorkspaceByLocator(pkg)) {
            continue
          }

          // Ignore GitHub dependencies. In the future we could consider adding
          // some custom logic to test this, but for now let's just ignore them
          // so at least the plugin doesn't break.
          if (pkg.reference.includes("github.com")) {
            continue
          }

          dependencies.push({
            dependencyType,
            descriptor,
            name: structUtils.stringifyIdent(descriptor),
            pkg,
            workspace,
          })
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
          formatUtils.Type.CODE
        )} doesn't match any packages referenced by any workspace`
      )
    }

    return filteredDependencies
  }

  throw(configuration: Configuration, item: Descriptor | Locator): never {
    const name = structUtils.prettyIdent(configuration, item)
    throw new Error(`Package for ${name} not found in the project`)
  }

  getSeverity(currentVersion: string, latestVersion: string): Severity {
    const current = semver.coerce(currentVersion)!
    const latest = semver.coerce(latestVersion)!

    return semver.eq(current, latest)
      ? null
      : current.major === 0 || latest.major > current.major
      ? "major"
      : latest.minor > current.minor
      ? "minor"
      : "patch"
  }

  /**
   * Iterates through the dependencies to find the outdated dependencies and
   * sort them in ascending order.
   */
  async getOutdatedDependencies(
    configuration: Configuration,
    project: Project,
    fetcher: DependencyFetcher,
    dependencies: DependencyInfo[],
    progress?: ReturnType<typeof Report["progressViaCounter"]>
  ): Promise<OutdatedDependency[]> {
    const outdated = dependencies.map(
      async ({ dependencyType, descriptor, name, pkg, workspace }) => {
        const { latest, range, url } = await fetcher.fetch({
          descriptor,
          includeRange: this.includeRange,
          includeURL: this.includeURL(configuration),
          pkg,
        })

        // JSON reports don't use progress, so this only applies for non-JSON cases.
        progress?.tick()

        if (isVersionOutdated(pkg.version!, latest)) {
          return {
            current: pkg.version!,
            latest,
            name,
            range,
            severity: {
              latest: this.getSeverity(pkg.version!, latest)!,
              range: range ? this.getSeverity(pkg.version!, range) : null,
            },
            type: dependencyType,
            url,
            workspace: this.includeWorkspace(project)
              ? this.getWorkspaceName(workspace)
              : undefined,
          }
        }
      }
    )

    return (await Promise.all(outdated))
      .filter(truthy)
      .filter((dep) => this.severity?.includes(dep.severity.latest) ?? true)
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  getWorkspaceName(workspace: Workspace) {
    return workspace.manifest.name
      ? structUtils.stringifyIdent(workspace.manifest.name)
      : workspace.computeCandidateName()
  }

  printOutdatedCount(report: StreamReport, count: number) {
    const args = [
      MessageName.UNNAMED,
      count === 1
        ? "1 dependency is out of date"
        : `${count} dependencies are out of date`,
    ] as const

    // If the user passed the `--check` flag, we report the count of outdated
    // dependencies as an error rather than a warning.
    if (this.check) {
      report.reportError(...args)
    } else {
      report.reportWarning(...args)
    }
  }
}
