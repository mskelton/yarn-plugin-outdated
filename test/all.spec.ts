import { makeTemporaryEnv } from "./utils/env"

describe("yarn outdated --all", () => {
  it("should include packages from all workspaces", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", { workspaces: ["a", "b"] })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.0" } })
    await writeJSON("b/package.json", { dependencies: { minor: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --all")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })

  it("should fallback to computed workspace name", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated -a")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })
})
