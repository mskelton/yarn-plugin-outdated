import { Cache, Descriptor, Project, Workspace } from "@yarnpkg/core"
import { suggestUtils } from "@yarnpkg/plugin-essentials"
import { parseVersion } from "./utils"

export class DependencyFetcher {
  constructor(
    private project: Project,
    private workspace: Workspace,
    private cache: Cache
  ) {}

  async fetch(descriptor: Descriptor, range: string) {
    const candidate = await suggestUtils.fetchDescriptorFrom(
      descriptor,
      range,
      {
        cache: this.cache,
        preserveModifier: descriptor.range,
        project: this.project,
        workspace: this.workspace,
      }
    )

    return parseVersion(candidate === null ? descriptor.range : candidate.range)
  }
}
