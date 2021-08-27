import { makeTemporaryEnv } from "./utils/env"

describe.only("yarn outdated --all", () => {
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

  it.only("should fallback to computed workspace name", async () => {
    const { run, writeFile, writeJson } = await makeTemporaryEnv()

    const packageJSON = { dependencies: { patch: "1.0.0" } }
    const lockfile = `
__metadata:
  version: 4
  cacheKey: 0

"patch@npm:1.0.0":
  version: 1.0.0
  resolution: "patch@npm:1.0.0"
  checksum: foo
  languageName: node
  linkType: hard
`

    await writeJson("package.json", packageJSON)
    await writeFile("yarn.lock", lockfile)
    await run("install")

    const { stderr, stdout } = await run("outdated -a")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBeNull()
  })
})
