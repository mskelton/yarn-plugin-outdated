import {
  Cache,
  Configuration,
  Descriptor,
  Manifest,
  Package,
  Project,
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
    private cache: Cache,
  ) {}

  async fetch({ descriptor, includeRange, includeURL, pkg }: FetchOptions) {
    try {
      const [latest, range, homepageURL] = await Promise.all([
        this.suggest(pkg, "latest"),
        includeRange ? this.suggest(pkg, descriptor.range) : Promise.resolve(),
        includeURL ? this.fetchURL(pkg) : Promise.resolve(),
      ])

      return {
        latest: latest?.range,
        range: range?.range,
        url: homepageURL ?? undefined,
      }
    } catch (error) {
      return { error }
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
      cacheOptions: {
        skipIntegrityCheck: true,
      },
      checksums: this.project.storedChecksums,
      fetcher,
      project: this.project,
      report: new ThrowReport(),
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
