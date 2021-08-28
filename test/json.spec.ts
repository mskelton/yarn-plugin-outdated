import { makeTemporaryEnv } from "./utils/env"

describe("yarn outdated --json", () => {
  it("should show outdated dependencies", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", {
      dependencies: { patch: "1.0.0" },
      devDependencies: { minor: "1.0.0" },
    })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    expect(JSON.parse(stdout)).toMatchSnapshot()
    expect(stderr).toBe("")
  })

  it("should display empty state if no dependencies are outdated", async () => {
    const { run, writeJSON } = await makeTemporaryEnv()

    await writeJSON("package.json", { dependencies: { patch: "1.0.1" } })
    await run("install")

    const { stderr, stdout } = await run("outdated --json")
    expect(JSON.parse(stdout)).toEqual([])
    expect(stderr).toBe("")
  })
})
