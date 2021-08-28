import { expect, test } from "../fixtures/env"

const manifest = {
  dependencies: {
    "@scoped/minor": "1.0.0",
    "@scoped/patch": "1.0.0",
    minor: "1.0.0",
    patch: "1.0.0",
  },
}

test("can filter by an exact package name", async ({ env }) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated patch")
  expect(stdout).toMatchSnapshot("stdout.txt")
  expect(stderr).toBe("")
})

test("can filter using a wildcard", async ({ env }) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated @scoped/*")
  expect(stdout).toMatchSnapshot("stdout.txt")
  expect(stderr).toBe("")
})

test("should throw an error if the pattern doesn't match any packages", async ({
  env,
}) => {
  const { run, writeJSON } = env

  await writeJSON("package.json", manifest)
  await run("install")

  const { stderr, stdout } = await run("outdated not-a-package")
  expect(stdout).toMatchSnapshot("stdout.txt")
  expect(stderr).toBe("")
})
