import {
  Configuration,
  Package,
  structUtils,
} from "@yarnpkg/core"
import { npmHttpUtils } from "@yarnpkg/plugin-npm"
import { Packument } from "@npm/types"

interface FetchOptions {
  pkg: Package
  url: boolean
}

export class DependencyFetcher {
  constructor(
    private configuration: Configuration,
  ) {}

  async fetch({ pkg }: FetchOptions) {
    const ident = structUtils.makeIdent(pkg.scope, pkg.name);
    const identUrl = npmHttpUtils.getIdentUrl(ident)
    const npmResult = await npmHttpUtils.get(identUrl, {
      configuration: this.configuration,
      customErrorMessage: npmHttpUtils.customPackageError,
      ident,
      jsonResponse: true,
    })as Packument;

    return {
      npmResult,
    }
  }
}