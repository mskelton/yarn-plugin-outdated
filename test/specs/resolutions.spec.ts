import { expect, test } from "../fixtures/env"

test.describe("Resolutions", () => {
  test("respects resolutions to determine if a package is outdated", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { workspaces: ["a"] })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.0" } })
    await run("set resolution patch 1.1.0")
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("resolutions.txt")
    expect(stderr).toBe("")
  })
})
