import { expect, test } from "../fixtures/env"
import { prettyJSON } from "../utils/format"

test.describe.parallel("yarn outdated --json", () => {
  test("shows outdated dependencies", async ({ run, writeJSON }) => {
    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    expect(prettyJSON(stdout)).toMatchSnapshot("json.txt")
    expect(stderr).toBe("")
  })

  test("displays an empty state if no dependencies are outdated", async ({
    run,
    writeJSON,
  }) => {
    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    expect(JSON.parse(stdout)).toEqual([])
    expect(stderr).toBe("")
  })
})
