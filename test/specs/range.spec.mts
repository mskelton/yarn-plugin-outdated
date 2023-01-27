import { expect, test } from "../fixtures/env.mjs"

test.describe("yarn outdated --range", () => {
  test("includes the latest version satisfying the range", async ({
    run,
    writeJSON,
  }) => {
    // Lock the versions to 1.0.0 before adding the range specifiers
    await writeJSON("package.json", {
      dependencies: { major: "1.0.0", minor: "1.0.0", patch: "1.0.0" },
    })
    await run("install")

    // Add the range specifiers and run an immutable install to prevent
    // modifying the locked versions
    await writeJSON("package.json", {
      dependencies: { major: "^1.0.0", minor: "~1.0.0", patch: "1.0.0" },
    })
    await run("install --immutable")

    const { code, stderr, stdout } = await run("outdated --range")
    expect(stdout).toMatchSnapshot("range.txt")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })
})
