import { expect, test } from "../fixtures/env"

test.describe.parallel("workspaces", () => {
  test("includes packages from all workspaces", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { workspaces: ["a", "b"] })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.0" } })
    await writeJSON("b/package.json", { dependencies: { minor: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("workspaces.txt")
    expect(stderr).toBe("")
  })

  test("falls back to the computed workspace name", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      workspaces: ["a"],
    })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("computed-workspace-name.txt")
    expect(stderr).toBe("")
  })

  test("skips private packages", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { workspaces: ["packages/*"] })
    await writeJSON("packages/a/package.json", {
      name: "a",
      private: true,
      version: "1.1.0",
    })
    await writeJSON("packages/b/package.json", {
      dependencies: { a: "1.1.0", patch: "1.0.0" },
      name: "b",
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("private.txt")
    expect(stderr).toBe("")
  })

  test.describe("--workspace", () => {
    test("only includes packages in the current workspace", async ({ env }) => {
      const { run, writeJSON } = env

      const deps = { patch: "1.0.0" }
      await writeJSON("package.json", { dependencies: deps, workspaces: ["a"] })
      await writeJSON("a/package.json", { dependencies: deps })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace")
      expect(stdout).toMatchSnapshot("current-workspace.txt")
      expect(stderr).toBe("")
    })
  })
})
