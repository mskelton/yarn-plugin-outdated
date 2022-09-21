import { expect, test } from "../fixtures/env"

test.describe.parallel("yarn outdated --markdown", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --markdown")
    expect(stdout).toMatchSnapshot("markdown.txt")
    expect(stderr).toBe("")
  })

  test("displays an empty state if no dependencies are outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --markdown")
    expect(stdout).toEqual("\n")
    expect(stderr).toBe("")
  })

  test("prevents both JSON flag and Markdown flag being used at the same time", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --markdown --json")
    expect(stdout).toMatchSnapshot("format-error.txt")
    expect(stderr).toBe("")
  })
})
