import { makeTemporaryEnv } from "./utils/env"

const manifest = {
  dependencies: {
    "@scoped/minor": "1.0.0",
    "@scoped/patch": "1.0.0",
    minor: "1.0.0",
    patch: "1.0.0",
  },
}

it("can filter by an exact package name", async () => {
  const { run, writeJSON } = await makeTemporaryEnv()

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated patch")
  expect(stdout).toMatchSnapshot()
  expect(stderr).toBe("")
})

it("can filter using a wildcard", async () => {
  const { run, writeJSON } = await makeTemporaryEnv()

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated @scoped/*")
  expect(stdout).toMatchSnapshot()
  expect(stderr).toBe("")
})

it("should throw an error if the pattern doesn't match any packages", async () => {
  const { run, writeJSON } = await makeTemporaryEnv()

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated not-a-package")
  expect(stdout).toMatchSnapshot()
  expect(stderr).toBe("")
})
