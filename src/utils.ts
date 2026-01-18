import { Manifest } from "@yarnpkg/core"
import { fromUrl } from "hosted-git-info"
import semver from "semver"

export const truthy = Boolean as unknown as <T>(
  arg: T | undefined | null | false,
) => arg is T

export function getHomepageURL({ raw: manifest }: Manifest): string | null {
  // Prefer the homepage over the repository URL
  if (manifest.homepage) {
    return manifest.homepage
  }

  const repo = manifest.repository
  const repoURL =
    typeof repo === "string"
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

const isNumber = (value: string | number): value is number =>
  typeof value === "number"

const padArray = (arr: number[], length: number) =>
  arr.concat(Array(length - arr.length).fill(0))

const parsePreRelease = (prerelease: readonly (string | number)[]) =>
  padArray(prerelease.filter(isNumber), 3).join(".")

export function isVersionOutdated(current: string, latest: string) {
  const latestPrerelease = semver.prerelease(latest)
  const currentPrerelease = semver.prerelease(current)

  if (semver.eq(current, latest) && latestPrerelease && currentPrerelease) {
    return semver.lt(
      parsePreRelease(currentPrerelease),
      parsePreRelease(latestPrerelease),
    )
  }

  return semver.lt(current, latest)
}
