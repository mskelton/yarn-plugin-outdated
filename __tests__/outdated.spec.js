import { formatUtils } from "../__mocks__/@yarnpkg/core"
import { run } from "./utils"

const candidates = {
  "@test-scope/package-a": "^3.4.0",
  "package-a": "1.1.0",
  "package-b": "^1.3.0",
  "package-c": "~1.2.1",
  "package-d": "^2.0.0",
}

describe("yarn outdated", () => {
  it("should show outdated dependencies", async () => {
    const output = await run("outdated", {
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
    const output = await run("outdated", {
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

  it("should highlight package names and version ranges", async () => {
    formatUtils.pretty.mockImplementation(
      (_, string, format) => `{${format}}${string}{${format}}`
    )

    const output = await run("outdated", {
      candidates,
      manifest: {
        dependencies: {
          "package-a": "1.1.0",
          "package-b": "^1.1.1",
          "package-c": "~1.2.0",
          "package-d": ">= 1",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })

  it("should display empty state if no dependencies are outdated", async () => {
    const output = await run("outdated", {
      candidates,
      manifest: {
        dependencies: {
          "package-a": "1.1.0",
        },
      },
    })

    expect(output).toBe("✨ All your dependencies are up to date!\n")
  })

  it("should ignore non-semver ranges", async () => {
    const output = await run("outdated", {
      candidates,
      manifest: {
        devDependencies: {
          "package-b": "^1.1.1",
          "package-c": "next",
          "package-d": "workspace:^1.2.3",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })

  it("should properly format scoped dependencies", async () => {
    const output = await run("outdated", {
      candidates,
      manifest: {
        dependencies: {
          "@test-scope/package-a": "^3.0.1",
        },
        devDependencies: {
          "package-a": "^1.0.1",
        },
      },
    })

    expect(output).toMatchSnapshot()
  })
})
