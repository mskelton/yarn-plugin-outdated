import { run } from "./utils"

const candidates = {
  "package-a": "1.1.0",
  "package-b": "^1.3.0",
  "package-c": "~1.2.1",
  "package-d": "^2.0.0",
}

describe("yarn outdated --check", () => {
  it("should return exit code 0 when dependencies are up to date", async () => {
    const output = await run("outdated --check", {
      candidates,
      manifest: {
        dependencies: {
          "package-a": "1.1.0",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })

  it("should return exit code 1 when outdated dependencies are found", async () => {
    const output = run("outdated -c", {
      candidates,
      manifest: {
        dependencies: {
          "package-a": "1.1.0",
          "package-b": "^1.1.1",
          "package-c": "~1.2.0",
        },
      },
    })

    await expect(output).rejects.toMatchSnapshot()
  })
})
