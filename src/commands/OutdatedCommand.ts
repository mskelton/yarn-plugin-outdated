import {
  Cache,
  CommandContext,
  Configuration,
  Descriptor,
  Project,
  structUtils,
  Workspace,
} from "@yarnpkg/core"
import { suggestUtils } from "@yarnpkg/plugin-essentials"
import { Command } from "clipanion"
import * as semver from "semver"
import { parseVersion } from "../utils/semver"
import { printTable } from "../utils/table"

export class OutdatedCommand extends Command<CommandContext> {
  @Command.Boolean("-a,--all")
  all = false

  @Command.Boolean("-w,--wanted")
  wanted = false

  @Command.Path("outdated")
  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    )

    const { project, workspace } = await Project.find(
      configuration,
      this.context.cwd
    )

    const dependencies = await this.getOutdatedDependencies(
      configuration,
      project,
      workspace!,
      await Cache.find(configuration)
    )

    printTable(
      configuration,
      dependencies.filter((dep) => semver.neq(dep.current!, dep.latest!))
    )
  }

  async getOutdatedDependencies(
    configuration: Configuration,
    project: Project,
    workspace: Workspace,
    cache: Cache
  ) {
    const dependencies = []
    const dependencyTypes = ["dependencies", "devDependencies"] as const

    for (const workspace of project.workspaces) {
      for (const dependencyType of dependencyTypes) {
        for (const desc of workspace.manifest[dependencyType].values()) {
          dependencies.push({
            current: parseVersion(desc.range),
            descriptor: desc,
            name: structUtils.stringifyIdent(desc),
            type: dependencyType,
          })
        }
      }
    }

    const sortedDependencies = dependencies
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(async (dep) => {
        const latestVersion = await this.fetchLatestDescriptor(
          project,
          workspace,
          cache,
          dep.descriptor
        )

        return {
          ...dep,
          latest: parseVersion(latestVersion),
        }
      })

    return Promise.all(sortedDependencies)
  }

  async fetchLatestDescriptor(
    project: Project,
    workspace: Workspace,
    cache: Cache,
    descriptor: Descriptor,
    range = "latest"
  ) {
    const candidate = await suggestUtils.fetchDescriptorFrom(
      descriptor,
      range,
      {
        cache,
        preserveModifier: descriptor.range,
        project,
        workspace,
      }
    )

    return candidate === null ? descriptor.range : candidate.range
  }
}
