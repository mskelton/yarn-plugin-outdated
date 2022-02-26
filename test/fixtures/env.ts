import { test as base } from "@playwright/test"
import { makeTemporaryEnv } from "../utils/env"

type Environment = Awaited<ReturnType<typeof makeTemporaryEnv>>

interface EnvironmentFixtures extends Omit<Environment, "destroy"> {
  env: Omit<Environment, "destroy">
}

export const test = base.extend<EnvironmentFixtures>({
  env: async ({}, use, testInfo) => {
    // Will be moved to the global config after v1.19
    // https://github.com/microsoft/playwright/pull/11132
    testInfo.snapshotSuffix = ""

    const { destroy, ...env } = await makeTemporaryEnv()
    await use(env)
    await destroy()
  },
  readFile: ({ env }, use) => use(env.readFile),
  registry: ({ env }, use) => use(env.registry),
  run: ({ env }, use) => use(env.run),
  writeFile: ({ env }, use) => use(env.writeFile),
  writeJSON: ({ env }, use) => use(env.writeJSON),
})

export const expect = test.expect
