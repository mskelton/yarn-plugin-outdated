import { expect, test } from "../fixtures/env"
import { prettyJSON } from "../utils/format"

test.describe("yarn outdated --format=json", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --format=json")
    expect(prettyJSON(stdout)).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("displays an empty state if no dependencies are outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --format=json")
    expect(JSON.parse(stdout)).toEqual([])
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("works with deprecated --json option", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --json")
    expect(prettyJSON(stdout)).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("respects the --check flag", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --format=json --check")
    expect(prettyJSON(stdout)).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })
})

test.describe("yarn outdated --format", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --format=markdown")
    expect(stdout).toMatchSnapshot("markdown.md")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("displays an empty state if no dependencies are outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { code, stderr, stdout } = await run("outdated --format=markdown")
    expect(stdout).toBe("✨ All your dependencies are up to date!\n")
    expect(stderr).toBe("")
    expect(code).toBe(0)
  })

  test("respects the --check flag", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { code, stderr, stdout } = await run(
      "outdated --format=markdown --check"
    )
    expect(stdout).toMatchSnapshot("markdown.md")
    expect(stderr).toBe("")
    expect(code).toBe(1)
  })
})

test("errors with invalid format", async ({ run }) => {
  const { code, stderr, stdout } = await run("outdated --format=blah")
  expect(stdout).toMatchSnapshot("format-error.txt")
  expect(stderr).toBe("")
  expect(code).toBe(1)
})
