import { Manifest } from "@yarnpkg/core"
import semver from "semver"

export const truthy = Boolean as unknown as <T>(
  arg: T | undefined | null | false
) => arg is T

function parseRepository(repository: string) {
  const [_, provider, repo] =
    repository.match(
      /^(github|bitbucket|gitlab|(?:git\+)?https?|git|git@[^:]+):(.+)/
    ) ?? []

  if (provider === "http" || provider === "https") {
    // HTTP - use as is
    return repository
  } else if (provider === "git") {
    // Unencrypted git:// protocol - replace with http (as supported by GitHub)
    return `https:${repo}`
  } else if (provider?.startsWith("git@")) {
    // SSH protocol as used by GitHub, GitLab
    return `https://${provider.split("@")[1]}/${repo}`
  } else if (provider) {
    // Shortcut syntax for GitHub, GitLab, Bitbucket -
    // https://docs.npmjs.com/cli/v8/configuring-npm/package-json#repository
    const tld = provider === "bitbucket" ? "org" : "com"
    return `https://${provider}.${tld}/${repo}`
  } else {
    return `https://github.com/${repository}`
  }
}

export function getHomepageURL(manifest: Manifest) {
  const { homepage, repository } = manifest.raw

  return homepage
    ? homepage
    : typeof repository === "string"
    ? parseRepository(repository)
    : repository?.url
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
