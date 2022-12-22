import { test as base } from "@playwright/test"
import { makeTemporaryEnv } from "../utils/env"

type Environment = Awaited<ReturnType<typeof makeTemporaryEnv>>

interface EnvironmentFixtures extends Omit<Environment, "destroy"> {
  env: Record<string, string>
  yarnEnv: Omit<Environment, "destroy">
}

export const test = base.extend<EnvironmentFixtures>({
  cwd: ({ yarnEnv }, use) => use(yarnEnv.cwd),
  env: {},
  readFile: ({ yarnEnv }, use) => use(yarnEnv.readFile),
  registry: ({ yarnEnv }, use) => use(yarnEnv.registry),
  run: ({ yarnEnv }, use) => use(yarnEnv.run),
  writeFile: ({ yarnEnv }, use) => use(yarnEnv.writeFile),
  writeJSON: ({ yarnEnv }, use) => use(yarnEnv.writeJSON),
  yarnEnv: async ({ env }, use, testInfo) => {
    testInfo.snapshotSuffix = ""
    const { destroy, ...yarnEnv } = await makeTemporaryEnv(env)
    await use(yarnEnv)
    await destroy()
  },
})

export const expect = test.expect
