import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli"
import {
  Cache,
  Configuration,
  Project,
  structUtils,
  Workspace,
} from "@yarnpkg/core"
import { Command, Usage } from "clipanion"
import { EOL } from "os"
import * as semver from "semver"
import { DependencyFetcher } from "./DependencyFetcher"
import { DependencyTable } from "./DependencyTable"
import { DependencyInfo, OutdatedDependency } from "./types"
import { excludeFalsey, parseVersion } from "./utils"

export class OutdatedCommand extends BaseCommand {
  static usage: Usage = Command.Usage({
    description: "view outdated dependencies",
    details:
      "This command finds outdated dependencies in a project and prints the result in a table or JSON format.",
    examples: [["View outdated dependencies", "yarn outdated"]],
  })

  @Command.Boolean("-a,--all", {
    description: "Include outdated dependencies from all workspaces",
  })
  all = false

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
    const dependencies = this.getDependencies(workspaces)
    const outdated = await this.getOutdatedDependencies(fetcher, dependencies)

    if (this.json) {
      this.context.stdout.write(JSON.stringify(outdated) + EOL)
    } else if (outdated.length) {
      new DependencyTable(this.context, configuration, outdated, {
        workspace: this.all,
      }).print()
    } else {
      this.context.stdout.write(
        `✨ All your dependencies are up to date!${EOL}`
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
  getDependencies(workspaces: Workspace[]) {
    const dependencies: DependencyInfo[] = []
    const dependencyTypes = ["dependencies", "devDependencies"] as const

    for (const workspace of workspaces) {
      for (const dependencyType of dependencyTypes) {
        for (const descriptor of workspace.manifest[dependencyType].values()) {
          // Only include valid semver ranges. Non-semver ranges such as tags
          // (e.g. `next`) or protocols (e.g. `workspace:*`) should be ignored.
          if (semver.coerce(descriptor.range)) {
            dependencies.push({ dependencyType, descriptor, workspace })
          }
        }
      }
    }

    return dependencies
  }

  /**
   * Iterates through the dependencies to find the outdated dependencies and
   * sort them in ascending order.
   */
  async getOutdatedDependencies(
    fetcher: DependencyFetcher,
    dependencies: DependencyInfo[]
  ): Promise<OutdatedDependency[]> {
    const outdated = dependencies.map(
      async ({ dependencyType, descriptor, workspace }) => {
        const latest = await fetcher.fetch(descriptor, "latest")
        const current = parseVersion(descriptor.range)

        if (current !== latest) {
          return {
            current,
            latest,
            name: structUtils.stringifyIdent(descriptor),
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

  private getWorkspaceName(workspace: Workspace) {
    return workspace.manifest.name
      ? structUtils.stringifyIdent(workspace.manifest.name)
      : workspace.computeCandidateName()
  }
}
