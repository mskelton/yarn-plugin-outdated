import * as semver from "semver"

export const truthy = Boolean as unknown as <T>(
  arg: T | undefined | null | false
) => arg is T

export const parseVersion = (range: string) =>
  semver.valid(semver.coerce(range))
