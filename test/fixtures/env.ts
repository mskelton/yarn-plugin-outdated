import { test as base } from "@playwright/test"
import { makeTemporaryEnv } from "../utils/env"

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type Environment = Omit<ThenArg<ReturnType<typeof makeTemporaryEnv>>, "destroy">

interface EnvironmentFixtures {
  env: Environment
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
})

export const expect = test.expect
