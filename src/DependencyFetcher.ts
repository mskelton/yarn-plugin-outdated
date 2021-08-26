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
    const ident = structUtils.convertToIdent(pkg)
    const candidate = await suggestUtils.fetchDescriptorFrom(ident, range, {
      cache: this.cache,
      preserveModifier: false,
      project: this.project,
      workspace: this.workspace,
    })

    if (!candidate) {
      const name = structUtils.prettyIdent(this.configuration, ident)
      throw new Error(`Could not fetch candidate for ${name}.`)
    }

    return candidate.range
  }
}
