import { run } from "./utils"

const candidates = {
  "package-a": "1.1.0",
  "package-b": "^1.3.0",
  "package-c": "~1.2.1",
  "package-d": "^2.0.0",
}

describe("yarn outdated --all", () => {
  it("should include packages from all workspaces", async () => {
    const output = await run("outdated --all", {
      candidates,
      manifests: [
        {
          dependencies: {
            "package-a": "1.1.0",
            "package-b": "^1.1.1",
            "package-c": "~1.2.0",
          },
          name: {
            name: "workspace-a",
            scope: null,
          },
        },
        {
          devDependencies: {
            "package-c": "~1.2.0",
            "package-d": "> 1.1.0",
          },
          name: {
            name: "workspace-b",
            scope: "my-scope",
          },
        },
      ],
    })

    expect(output).toMatchSnapshot()
  })

  it("should fallback to computed workspace name", async () => {
    const output = await run("outdated -a", {
      candidates,
      manifests: [
        {
          dependencies: {
            "package-a": "1.1.0",
            "package-b": "^1.1.1",
          },
        },
      ],
    })

    expect(output).toMatchSnapshot()
  })
})
