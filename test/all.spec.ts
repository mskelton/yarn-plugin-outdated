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
    const { run, writeLockfile, writeManifest } = await makeTemporaryEnv()

    await writeManifest({
      dependencies: { patch: "1.0.0" },
    })
    await writeLockfile({ patch: "1.0.0" })
    await run("install --immutable")

    const { stderr, stdout } = await run("outdated -a")
    expect(stdout).toMatchSnapshot()
    expect(stderr).toBeNull()
  })
})
