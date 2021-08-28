import { makeTemporaryEnv } from "./utils/env"

describe("yarn outdated", () => {
  it("should show outdated dependencies", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  it("should display empty state if no dependencies are outdated", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })

  it("should ignore non-semver ranges", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

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
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })

  it("should properly format scoped dependencies", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", {
      dependencies: { "@scoped/patch": "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
  })

  it.todo("should properly colorize the output")
  it.todo("should throw an error when a package is not found")
  it.todo("should throw an error when a package version is not found")
})
