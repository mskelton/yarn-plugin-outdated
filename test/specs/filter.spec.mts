import { expect, test } from "../fixtures/env.mjs"

test.describe("yarn outdated", () => {
  test("filters based on dependency type", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --type=devDependencies")
    expect(stdout).toMatchSnapshot("dependency-type.txt")
    expect(stderr).toBe("")
  })

  test("filters based on outdated severity", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { major: "1.0.0", minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --severity=major")
    expect(stdout).toMatchSnapshot("severity.txt")
    expect(stderr).toBe("")
  })

  test("can include multiple severity filters", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { major: "1.0.0", minor: "1.0.0", patch: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run(
      "outdated --severity=patch --severity=minor"
    )
    expect(stdout).toMatchSnapshot("multiple-severities.txt")
    expect(stderr).toBe("")
  })
})
