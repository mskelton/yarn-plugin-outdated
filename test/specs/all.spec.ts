import { expect, test } from "../fixtures/env"

test.describe("yarn outdated --all", () => {
  test("includes packages from all workspaces", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { workspaces: ["a", "b"] })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.0" } })
    await writeJSON("b/package.json", { dependencies: { minor: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --all")
    expect(stdout).toMatchSnapshot("all-workspaces.txt")
    expect(stderr).toBe("")
  })

  test("falls back to the computed workspace name", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated -a")
    expect(stdout).toMatchSnapshot("computed-workspace-name.txt")
    expect(stderr).toBe("")
  })
})
