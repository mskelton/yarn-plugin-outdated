import { run } from "./utils"

const command = "outdated --json"
const candidates = {
  "package-a": "1.1.0",
  "package-b": "^1.3.0",
  "package-c": "~1.2.1",
  "package-d": "^2.0.0",
}

const runJson = (...args) => run(...args).then(JSON.parse)

describe("yarn outdated --json", () => {
  it("should show outdated dependencies", async () => {
    const output = await runJson(command, {
      candidates,
      manifest: {
        dependencies: {
          "package-a": "1.1.0",
          "package-b": "^1.1.1",
          "package-c": "~1.2.0",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })

  it("should show outdated devDependencies", async () => {
    const output = await runJson(command, {
      candidates,
      manifest: {
        devDependencies: {
          "package-b": "^1.1.1",
          "package-c": "~1.2.1",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })

  it("should display empty state if no dependencies are outdated", async () => {
    const output = await runJson(command, {
      candidates,
      manifest: {
        dependencies: {
          "package-a": "1.1.0",
        },
      },
    })

    expect(output).toEqual([])
  })

  it("should ignore non-semver ranges", async () => {
    const output = await runJson(command, {
      candidates,
      manifest: {
        dependencies: {
          "package-b": "^1.1.1",
          "package-c": "next",
          "package-d": "workspace:^1.2.3",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })
})
