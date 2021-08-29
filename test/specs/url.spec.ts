import { expect, test } from "../fixtures/env"
import { prettyJSON } from "../utils/format"

test.describe("yarn outdated --url", () => {
  test("displays the package homepage URL", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --url")
    expect(stdout).toMatchSnapshot("url.txt")
    expect(stderr).toBe("")
  })

  test("includes the URL in the json output", async ({ env }) => {
    const { run, writeJSON } = env

    await writeJSON("package.json", { dependencies: { patch: "1.0.0" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --url --json")
    expect(prettyJSON(stdout)).toMatchSnapshot("url-json.txt")
    expect(stderr).toBe("")
  })
})
