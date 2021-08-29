import {
  Cache,
  Configuration,
  Package,
  Project,
  structUtils,
  Workspace,
} from "@yarnpkg/core"
import { suggestUtils } from "@yarnpkg/plugin-essentials"

export class DependencyFetcher {
  constructor(
    private configuration: Configuration,
    private project: Project,
    private workspace: Workspace,
    private cache: Cache
  ) {}

  async fetch(pkg: Package, range: string) {
    const candidate = await suggestUtils.fetchDescriptorFrom(pkg, range, {
      cache: this.cache,
      preserveModifier: false,
      project: this.project,
      workspace: this.workspace,
    })

    if (!candidate) {
      const name = structUtils.prettyIdent(this.configuration, pkg)
      throw new Error(`Could not fetch candidate for ${name}.`)
    }

    return candidate.range
  }
}
