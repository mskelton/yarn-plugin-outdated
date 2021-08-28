import { expect, test } from "../fixtures/env"

test.describe("yarn outdated --check", () => {
  test("should return exit code 0 when dependencies are up to date", async () => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --check")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("should return exit code 1 when outdated dependencies are found", async () => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated -c")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })
})
