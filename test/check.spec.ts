import { makeTemporaryEnv } from "./utils/env"

describe("yarn outdated --check", () => {
  it("should return exit code 0 when dependencies are up to date", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --check")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  it("should return exit code 1 when outdated dependencies are found", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated -c")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })
})
