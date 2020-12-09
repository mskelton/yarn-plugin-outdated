import { BaseCommand, WorkspaceRequiredError } from "@yarnpkg/cli"
import {
  Cache,
  Configuration,
  Project,
  structUtils,
  Workspace,
} from "@yarnpkg/core"
import { Command } from "clipanion"
import * as semver from "semver"
import { DependencyFetcher } from "./DependencyFetcher"
import { DependencyTable } from "./DependencyTable"
import { DependencyInfo, OutdatedDependency } from "./types"
import { parseVersion } from "./utils/semver"

export class OutdatedCommand extends BaseCommand {
  @Command.Boolean("-a,--all")
  all = false

  @Command.Boolean("-w,--wanted")
  wanted = false

  @Command.Boolean("--json")
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
      console.log(JSON.stringify(outdated))
    } else {
      new DependencyTable(configuration, outdated, {
        wanted: this.wanted,
        workspace: this.all,
      }).print()
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
          dependencies.push({ dependencyType, descriptor, workspace })
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
        const referenceRange = semver.valid(descriptor.range)
          ? `^${descriptor.range}`
          : descriptor.range

        const [latest, wanted] = await Promise.all([
          fetcher.fetch(descriptor, "latest"),
          // Only fetch the wanted version if we need to.
          this.wanted ? fetcher.fetch(descriptor, referenceRange) : undefined,
        ])

        return {
          current: parseVersion(descriptor.range),
          latest,
          name: structUtils.stringifyIdent(descriptor),
          type: dependencyType,
          wanted,
          workspace: this.all ? workspace.computeCandidateName() : undefined,
        }
      }
    )

    return (await Promise.all(outdated))
      .filter((dep) => semver.neq(dep.current!, dep.latest!))
      .sort((a, b) => a.name.localeCompare(b.name))
  }
}
