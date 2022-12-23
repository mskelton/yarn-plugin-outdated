import { Manifest } from "@yarnpkg/core"
import { getHomepageURL } from "../../src/utils"
import { expect, test } from "../fixtures/env"
import { prettyJSON } from "../utils/format"

const manifest = {
  dependencies: {
    major: "1.0.0",
    minor: "1.0.0",
    patch: "1.0.0",
  },
}

test.describe("yarn outdated --url", () => {
  test("displays the package homepage URL", async ({ run, writeJSON }) => {
    await writeJSON("package.json", manifest)
    await run("install")

    const { stderr, stdout } = await run("outdated --url")
    expect(stdout).toMatchSnapshot("url.txt")
    expect(stderr).toBe("")
  })

  test("includes the URL in the json output", async ({ run, writeJSON }) => {
    await writeJSON("package.json", manifest)
    await run("install")

    const { stderr, stdout } = await run("outdated --url --json")
    expect(prettyJSON(stdout)).toMatchSnapshot("url-json.txt")
    expect(stderr).toBe("")
  })

  test("determines the homepage URL correctly", () => {
    const getURL = (raw: Record<string, unknown>) =>
      getHomepageURL({ raw } as Manifest)

    // npm
    expect(getURL({ repository: "npm/npm" })).toBe("https://github.com/npm/npm")

    // GitHub
    expect(getURL({ repository: "https://github.com/user/repo.git" })).toBe(
      "https://github.com/user/repo"
    )
    expect(getURL({ repository: "github:mskelton/yarn-plugin-outdated" })).toBe(
      "https://github.com/mskelton/yarn-plugin-outdated"
    )
    expect(getURL({ repository: "git://github.com/user/repo.git" })).toBe(
      "https://github.com/user/repo"
    )
    expect(getURL({ repository: "git@github.com:user/repo.git" })).toBe(
      "https://github.com/user/repo"
    )

    // BitBucket
    expect(getURL({ repository: "bitbucket:user/repo" })).toBe(
      "https://bitbucket.org/user/repo"
    )

    // GitLab
    expect(getURL({ repository: "gitlab:user/repo" })).toBe(
      "https://gitlab.com/user/repo"
    )

    // Other
    expect(getURL({ homepage: "https://foo.com" })).toBe("https://foo.com")
    expect(getURL({ homepage: "http://foo.com" })).toBe("http://foo.com")
    expect(getURL({ repository: { url: "http://foo.com" } })).toBe(
      "http://foo.com"
    )

    // Prefer homepage over repository
    expect(
      getURL({ homepage: "http://foo.com", repository: "http://bar.com" })
    ).toBe("http://foo.com")
  })

  test.describe("when outdatedIncludeURL config is true", () => {
    test.use({ env: { YARN_OUTDATED_INCLUDE_URL: "true" } })

    test("displays the package homepage URL by default", async ({
      run,
      writeJSON,
    }) => {
      await writeJSON("package.json", manifest)
      await run("install")

      const { stderr, stdout } = await run("outdated")
      expect(stdout).toMatchSnapshot("url.txt")
      expect(stderr).toBe("")
    })

    test("favors the flag over the config", async ({ run, writeJSON }) => {
      await writeJSON("package.json", manifest)
      await run("install")

      const { stderr, stdout } = await run("outdated --no-url")
      expect(stdout).toMatchSnapshot("no-url.txt")
      expect(stderr).toBe("")
    })
  })
})
