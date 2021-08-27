import { makeTemporaryEnv } from "./utils/env"

const candidates = {
  "package-a": "1.1.0",
  "package-b": "1.3.0",
  "package-c": "1.2.1",
  "package-d": "2.0.0",
}

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
    const { registry, run, writeFile, writeJson } = await makeTemporaryEnv()

    const packageJSON = {
      dependencies: {
        a: "1.1.0",
        b: "^1.1.1",
      },
    }

    const lockfile = `
__metadata:
  version: 4
  cacheKey: 8

"a@npm:1.1.0":
  version: 1.1.0
  resolution: "a@npm:1.1.0"
  checksum: b66e05fa25e42172a4f32aa8a5372203227f1b0e1c5d7879f45217a0fd0a5506a0f53f677ee532b8c92e53ce8404fdd60ba4cd83cfb806a19ad6472e6b75170b
  languageName: node
  linkType: hard

"b@npm:^1.1.1":
  version: 1.1.1
  resolution: "b@npm:^1.1.1"
  checksum: b66e05fa25e42172a4f32aa8a5372203227f1b0e1c5d7879f45217a0fd0a5506a0f53f677ee532b8c92e53ce8404fdd60ba4cd83cfb806a19ad6472e6b75170b
  languageName: node
  linkType: hard
`

    registry.packages = { a: "1.1.0", b: "1.3.0" }
    await writeJson("package.json", packageJSON)
    await writeFile("yarn.lock", lockfile)
    await run("install")

    const { stderr, stdout } = await run("outdated -a")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBeNull()
  })
})
