import { run } from "./utils"

const config = {
  candidates: {
    "@test-scope/package-a": "1.0.0",
    "@test-scope/package-b": "2.0.0",
    "package-a": "1.1.0",
    "package-b": "1.0.1",
  },
  manifest: {
    dependencies: {
      "@test-scope/package-a": "0.0.1",
      "@test-scope/package-b": "1.1.0",
      "package-a": "1.0.0",
      "package-b": "1.0.0",
    },
  },
}

it("can filter by an exact package name", async () => {
  const output = await run("outdated package-a", config)
  expect(output).toMatchSnapshot()
})

it("can filter using a wildcard", async () => {
  const output = await run("outdated @test-scope/*", config)
  expect(output).toMatchSnapshot()
})

it("should throw an error if the pattern doesn't match any packages", async () => {
  await expect(run("outdated not-a-package", config)).rejects.toThrowError(
    /Pattern not-a-package doesn't match any packages referenced by any workspace/
  )
})
