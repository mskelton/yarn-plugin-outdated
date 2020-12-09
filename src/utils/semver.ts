import * as semver from "semver"

export const parseVersion = (version: string) =>
  semver.valid(semver.coerce(version))!
