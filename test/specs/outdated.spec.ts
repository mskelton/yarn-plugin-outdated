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
    const { registry, run, writeJSON } = env
    await writeJSON("package.json", { dependencies: { foo: "1.0.0" } })

    const { code, stderr, stdout } = await run("outdated")
    const output = stdout.replace(registry.port.toString(), "<registry port>")
    expect(output).toMatchSnapshot("not-found.txt")
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })
})
