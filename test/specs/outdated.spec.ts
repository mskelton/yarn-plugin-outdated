import { expect, test } from "../fixtures/env"
import { readSupplementalFile, writeSupplementalFile } from "../utils/files"

test.describe("yarn outdated", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
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
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("empty.txt")
    expect(stderr).toBe("")
  })

  test("formats scoped dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { "@scoped/patch": "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("scoped.txt")
    expect(stderr).toBe("")
  })

  test("throws an error when a package is not found", async ({
    readFile,
    registry,
    run,
    writeFile,
    writeJSON,
  }) => {
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
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "^1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("lockfile.txt")
    expect(stderr).toBe("")
  })

  test("respects resolutions to determine if a package is outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", {
      dependencies: { minor: "1.0.0" },
      resolutions: { minor: "1.0.1" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("resolutions.txt")
    expect(stderr).toBe("")
  })

  test("handles non-semver ranges", async ({
    readFile,
    run,
    writeFile,
    writeJSON,
  }) => {
    await writeJSON("file-dep/package.json", { version: "1.1.0" })
    await writeFile("alias.patch", await readSupplementalFile("alias.patch"))

    const lockfile = "non-semver.lock"
    const dependencies = {
      "@scoped/patch": "patch:@scoped/patch@1.0.0#./alias.patch",
      alias: "npm:patch@1.0.0",
      file: "file:./file-dep",
      githubA: "mskelton/lazy-context",
      githubB: "github:mskelton/lazy-context",
      githubC: "git@github.com:mskelton/lazy-context.git",
    }

    // This test requires a lockfile, so anytime that it requires updating, run
    // `UPDATE_SNAPSHOTS=true yarn test` to update the snapshots.
    if (process.env.UPDATE_SNAPSHOTS) {
      await writeJSON("package.json", {
        dependencies: {
          ...dependencies,
          major: "1.0.0",
          minor: "1.0.0",
          patch: "1.0.0",
        },
        name: "foo",
      })

      await run("install")
      await writeSupplementalFile(lockfile, await readFile("yarn.lock"))
    }

    await writeJSON("package.json", {
      dependencies: {
        ...dependencies,
        major: "*",
        minor: ">1.0.0 <2.0.0",
        patch: "latest",
      },
      name: "foo",
    })
    await writeFile("yarn.lock", await readSupplementalFile(lockfile))
    await run("install --immutable")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("non-semver.txt")
    expect(stderr).toBe("")
  })

  test("ignores pre-release versions", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.1-alpha.1" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("pre-releases.txt")
    expect(stderr).toBe("")
  })
})
