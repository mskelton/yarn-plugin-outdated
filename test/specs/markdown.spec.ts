import { expect, test } from "../fixtures/env"

test.describe.parallel("yarn outdated --format=markdown", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --format=markdown")
    expect(stdout).toMatchSnapshot("markdown.md")
    expect(stderr).toBe("")
  })

  test("displays an empty state if no dependencies are outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --format=markdown")
    expect(stdout).toBe("✨ All your dependencies are up to date!\n")
    expect(stderr).toBe("")
  })
})
