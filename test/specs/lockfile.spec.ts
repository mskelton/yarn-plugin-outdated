import { expect, test } from "../fixtures/env"

test("defers to lockfile over manifest to check if a package is outdated", async ({
  env,
}) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", { dependencies: { patch: "^1.0.0" } })
  await run("install")

  const { stderr, stdout } = await run("outdated")
  expect(stdout).toMatchSnapshot("lockfile.txt")
  expect(stderr).toBe("")
})
