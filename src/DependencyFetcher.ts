import {
  Cache,
  Configuration,
  Descriptor,
  Manifest,
  Package,
  Project,
  structUtils,
  ThrowReport,
  Workspace,
} from "@yarnpkg/core"
import { suggestUtils } from "@yarnpkg/plugin-essentials"
import { getHomepageURL } from "./utils"

interface FetchOptions {
  descriptor: Descriptor
  includeRange: boolean
  includeURL: boolean
  pkg: Package
}

export class DependencyFetcher {
  constructor(
    private configuration: Configuration,
    private project: Project,
    private workspace: Workspace,
    private cache: Cache
  ) {}

  async fetch({ descriptor, includeRange, includeURL, pkg }: FetchOptions) {
    const [latest, range, homepageURL] = await Promise.all([
      this.suggest(pkg, "latest"),
      includeRange ? this.suggest(pkg, descriptor.range) : Promise.resolve(),
      includeURL ? this.fetchURL(pkg) : Promise.resolve(),
    ])

    if (!latest) {
      const name = structUtils.prettyIdent(this.configuration, pkg)
      throw new Error(`Could not fetch candidate for ${name}.`)
    }

    return {
      latest: latest.range,
      range: range?.range,
      url: homepageURL ?? "",
    }
  }

  private suggest(pkg: Package, range: string) {
    return suggestUtils.fetchDescriptorFrom(pkg, range, {
      cache: this.cache,
      preserveModifier: false,
      project: this.project,
      workspace: this.workspace,
    })
  }

  private async fetchURL(pkg: Package) {
    const fetcher = this.configuration.makeFetcher()
    const fetchResult = await fetcher.fetch(pkg, {
      cache: this.cache,
      checksums: this.project.storedChecksums,
      fetcher,
      project: this.project,
      report: new ThrowReport(),
      skipIntegrityCheck: true,
    })

    let manifest: Manifest | undefined
    try {
      manifest = await Manifest.find(fetchResult.prefixPath, {
        baseFs: fetchResult.packageFs,
      })
    } finally {
      fetchResult.releaseFs?.()
    }

    return getHomepageURL(manifest)
  }
}
