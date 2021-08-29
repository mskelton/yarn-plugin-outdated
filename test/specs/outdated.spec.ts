import { expect, test } from "../fixtures/env"

test.describe("yarn outdated", () => {
  test("shows outdated dependencies", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("outdated.txt")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("displays an empty state if no dependencies are outdated", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("empty.txt")
    expect(stderr).toBe("")
  })

  test("ignores non-semver ranges", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: {
        // TODO: Add tests for all non-semver ranges
        // major: "workspace:^1.2.3",
        minor: "latest",
        patch: "1.0.0",
      },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("non-semver.txt")
    expect(stderr).toBe("")
  })

  test("formats scoped dependencies", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: { "@scoped/patch": "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("scoped.txt")
    expect(stderr).toBe("")
  })

  test("throws an error when a package is not found", async ({ env }) => {
    const { readFile, registry, run, writeFile, writeJSON } = env
    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    // Read the current content of the manifest and lockfile
    const manifest = await readFile("package.json")
    const lockfile = await readFile("yarn.lock")

    // Write the manifest and lockfile with a missing package
    await writeFile("package.json", manifest.replace("patch", "not-found"))
    await writeFile("yarn.lock", lockfile.replace(/patch/g, "not-found"))

    const { code, stderr, stdout } = await run("outdated")
    const output = stdout.replace(registry.port.toString(), "<registry port>")
    expect(output).toMatchSnapshot("not-found.txt")
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })

  test("defers to lockfile over manifest to check if a package is outdated", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "^1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("lockfile.txt")
    expect(stderr).toBe("")
  })

  test("respects resolutions to determine if a package is outdated", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: { minor: "1.0.0" },
      resolutions: { minor: "1.0.1" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("resolutions.txt")
    expect(stderr).toBe("")
  })

  test("skips private packages", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: { private: "1.0.0" },
      workspaces: ["private"],
    })
    await writeJSON("private/package.json", {
      private: true,
      version: "1.1.0",
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("private.txt")
    expect(stderr).toBe("")
  })
})
