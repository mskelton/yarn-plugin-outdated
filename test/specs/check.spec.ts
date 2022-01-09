import { expect, test } from "../fixtures/env"

test.describe.parallel("yarn outdated --check", () => {
  test("returns exit code 0 when dependencies are up to date", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --check")
    expect(stdout).toMatchSnapshot("exit-code-0.txt")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("returns exit code 1 when outdated dependencies are found", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated -c")
    expect(stdout).toMatchSnapshot("exit-code-1.txt")
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })
})
