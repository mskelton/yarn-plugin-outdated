import { test as base } from "folio"
import { makeTemporaryEnv } from "../utils/env"

type ThenArg<T> = T extends PromiseLike<infer U> ? U : T
type Environment = Omit<ThenArg<ReturnType<typeof makeTemporaryEnv>>, "destroy">

interface EnvironmentFixtures {
  env: Environment
}

export const test = base.extend<EnvironmentFixtures>({
  env: async ({}, use) => {
    const { destroy, ...env } = await makeTemporaryEnv()
    await use(env)
    await destroy()
  },
})

export const expect = test.expect
