import { expect, test } from "../fixtures/env"

test.describe.parallel("workspaces", () => {
  test("includes packages from all workspaces", async ({ run, writeJSON }) => {
    await writeJSON("package.json", { workspaces: ["a", "b"] })
    await writeJSON("a/package.json", { dependencies: { patch: "1.0.0" } })
    await writeJSON("b/package.json", { dependencies: { minor: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("workspaces.txt")
    expect(stderr).toBe("")
  })

  test("falls back to the computed workspace name", async ({
    run,
    writeJSON,
  }) => {
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

  test("skips private packages", async ({ run, writeJSON }) => {
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
    test("only includes packages in the current workspace when no argument provided", async ({
      run,
      writeJSON,
    }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", { dependencies, workspaces: ["a"] })
      await writeJSON("a/package.json", { dependencies })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace")
      expect(stdout).toMatchSnapshot("current-workspace.txt")
      expect(stderr).toBe("")
    })

    test("filters workspaces using glob pattern", async ({
      run,
      writeJSON,
    }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", {
        dependencies,
        workspaces: ["name-a", "name-b", "other"],
      })
      await writeJSON("name-a/package.json", { dependencies })
      await writeJSON("name-b/package.json", { dependencies })
      await writeJSON("other/package.json", { dependencies })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace=name-*")
      expect(stdout).toMatchSnapshot("workspace-glob.txt")
      expect(stderr).toBe("")
    })

    test("can specify multiple glob patterns", async ({ run, writeJSON }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", {
        dependencies,
        workspaces: ["a", "b", "c"],
      })
      await writeJSON("a/package.json", { dependencies })
      await writeJSON("b/package.json", { dependencies })
      await writeJSON("c/package.json", { dependencies })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace=a,b")
      expect(stdout).toMatchSnapshot("multiple-workspace-globs.txt")
      expect(stderr).toBe("")
    })
  })
})
