import { expect, test } from "../fixtures/env"
import { prettyJSON } from "../utils/format"

test.describe("yarn outdated --format=json", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --format=json")
    expect(prettyJSON(stdout)).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
  })

  test("displays an empty state if no dependencies are outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --format=json")
    expect(JSON.parse(stdout)).toEqual([])
    expect(stderr).toBe("")
  })

  test("works with deprecated --json option", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    expect(prettyJSON(stdout)).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
  })
})

test.describe("yarn outdated --format", () => {
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

test("errors with invalid format", async ({ run }) => {
  const { stderr, stdout } = await run("outdated --format=blah")
  expect(stdout).toMatchSnapshot("format-error.txt")
  expect(stderr).toBe("")
})
