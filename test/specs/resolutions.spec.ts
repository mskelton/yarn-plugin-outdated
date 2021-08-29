import { expect, test } from "../fixtures/env"

test("respects resolutions to determine if a package is outdated", async ({
  env,
}) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", {
    dependencies: { minor: "1.0.0" },
    resolutions: { minor: "1.0.1" },
  })
  await run("install")

  const { stderr, stdout } = await run("outdated")
  expect(stdout).toMatchSnapshot("resolutions.txt")
  expect(stderr).toBe("")
})
