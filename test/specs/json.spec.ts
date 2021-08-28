import { expect, test } from "../fixtures/env"

test.describe("yarn outdated --json", () => {
  test("shows outdated dependencies", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    const json = JSON.stringify(JSON.parse(stdout), null, 2)
    expect(json).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
  })

  test("displays an empty state if no dependencies are outdated", async ({
    env,
  }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    expect(JSON.parse(stdout)).toEqual([])
    expect(stderr).toBe("")
  })
})
