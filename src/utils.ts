import { Manifest } from "@yarnpkg/core"
import { fromUrl } from "hosted-git-info"
import semver from "semver"

export const truthy = Boolean as unknown as <T>(
  arg: T | undefined | null | false
) => arg is T

export function getHomepageURL({ raw: manifest }: Manifest): string | null {
  const repo = manifest.repository
  const repoURL = manifest.homepage
    ? manifest.homepage
    : typeof repo === "string"
    ? repo
    : typeof repo === "object" && typeof repo.url === "string"
    ? repo.url
    : null

  const info = repoURL ? fromUrl(repoURL) : undefined
  const commitish = info?.committish ? `#${info.committish}` : ""

  return info
    ? `https://${info.domain}/${info.user}/${info.project}${commitish}`
    : repoURL
}

/**
 * Because some packages have a pre-release version as their `latest` version,
 * we need to first check if the latest version is a pre-release. If it is,
 * we compare the current and latest directly, otherwise we coerce the current
 * version to remove any pre-release identifiers to determine if it is outdated.
 */
export function isVersionOutdated(current: string, latest: string) {
  return semver.parse(latest)!.prerelease.length
    ? semver.lt(current, latest)
    : semver.lt(semver.coerce(current)!, latest)
}
