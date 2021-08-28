import { expect, test } from "../fixtures/env"

test.describe("yarn outdated --all", () => {
  test("should include packages from all workspaces", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { workspaces: ["a", "b"] })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.0" } })
    await writeJSON("b/package.json", { dependencies: { minor: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --all")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })

  test("should fallback to computed workspace name", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated -a")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })
})
