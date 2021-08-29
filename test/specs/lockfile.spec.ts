import { expect, test } from "../fixtures/env"

test.describe("Lockfile resolution", () => {
  test("defers to lockfile over manifest to check if a package is outdated", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "^1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated")
    expect(stdout).toMatchSnapshot("outdated.txt")
    expect(stderr).toBe("")
  })
})
