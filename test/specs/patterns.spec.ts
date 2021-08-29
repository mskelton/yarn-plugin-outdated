import { expect, test } from "../fixtures/env"

const manifest = {
  dependencies: {
    "@scoped/minor": "1.0.0",
    "@scoped/patch": "1.0.0",
    minor: "1.0.0",
    patch: "1.0.0",
  },
}

test("filters by an exact package name", async ({ env }) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated patch")
  expect(stdout).toMatchSnapshot("exact.txt")
  expect(stderr).toBe("")
})

test("filters using a wildcard", async ({ env }) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated @scoped/*")
  expect(stdout).toMatchSnapshot("wildcard.txt")
  expect(stderr).toBe("")
})

test("throws an error if the pattern doesn't match any packages", async ({
  env,
}) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated not-a-package")
  expect(stdout).toMatchSnapshot("no-match.txt")
  expect(stderr).toBe("")
})
