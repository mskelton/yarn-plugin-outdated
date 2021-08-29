import { Manifest } from "@yarnpkg/core"

export const truthy = Boolean as unknown as <T>(
  arg: T | undefined | null | false
) => arg is T

function parseRepository(repository: string) {
  const [_, provider, repo] =
    repository.match(/(github|bitbucket|gitlab):(.+)/) ?? []

  return provider
    ? `https://${provider}.${provider === "bitbucket" ? "org" : "com"}/${repo}`
    : `https://github.com/${repository}`
}

export function getHomepageURL(manifest: Manifest) {
  const { homepage, repository } = manifest.raw

  return homepage
    ? homepage
    : typeof repository === "string"
    ? parseRepository(repository)
    : repository?.url
}
