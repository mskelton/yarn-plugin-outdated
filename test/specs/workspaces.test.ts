import { ppath } from "@yarnpkg/fslib"
import { expect, test } from "../fixtures/env"

test.describe("workspaces", () => {
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
    test("filters in the current workspace when a period is specified", async ({
      cwd,
      run,
      writeJSON,
    }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", { dependencies, workspaces: ["a"] })
      await writeJSON("a/package.json", { dependencies })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace .", {
        cwd: ppath.join(cwd, "a"),
      })
      expect(stdout).toMatchSnapshot("period.txt")
      expect(stderr).toBe("")
    })

    test("filters by absolute directory", async ({ cwd, run, writeJSON }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", { dependencies, workspaces: ["a"] })
      await writeJSON("a/package.json", { dependencies })
      await writeJSON("b/package.json", { dependencies })
      await run("install")

      const { stderr, stdout } = await run(
        `outdated --workspace ${cwd}/a --workspace ${cwd}`
      )
      expect(stdout).toMatchSnapshot("directory-absolute.txt")
      expect(stderr).toBe("")
    })

    test("filters by relative directory", async ({ run, writeJSON }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", {
        dependencies,
        workspaces: ["packages/*"],
      })
      await writeJSON("packages/a/package.json", { dependencies })
      await writeJSON("packages/b/package.json", { dependencies })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace packages/a")
      expect(stdout).toMatchSnapshot("directory-relative.txt")
      expect(stderr).toBe("")
    })

    test("filters workspaces by name", async ({ run, writeJSON }) => {
      const dependencies = { patch: "1.0.0" }
      await writeJSON("package.json", { dependencies, workspaces: ["a", "b"] })
      await writeJSON("a/package.json", { dependencies, name: "one" })
      await writeJSON("b/package.json", { dependencies, name: "two" })
      await run("install")

      const { stderr, stdout } = await run("outdated --workspace two")
      expect(stdout).toMatchSnapshot("name.txt")
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

      const { stderr, stdout } = await run("outdated --workspace name-*")
      expect(stdout).toMatchSnapshot("glob.txt")
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

      const { stderr, stdout } = await run(
        "outdated --workspace a --workspace b"
      )
      expect(stdout).toMatchSnapshot("multiple-globs.txt")
      expect(stderr).toBe("")
    })
  })
})
