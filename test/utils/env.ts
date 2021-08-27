import { PortablePath, ppath, xfs } from "@yarnpkg/fslib"
import { URL } from "url"
import { Registry } from "./Registry"
import { execFile } from "./exec"

interface RunOptions {
  cwd?: PortablePath
}

export async function makeTemporaryEnv() {
  const registry = new Registry()
  const [tempDir, homeDir, registryUrl] = await Promise.all([
    xfs.mktempPromise(),
    xfs.mktempPromise(),
    registry.start(),
  ])

  const writeFile = async (target: string, body: string) => {
    const path = target as PortablePath
    await xfs.mkdirpPromise(ppath.join(tempDir, ppath.dirname(path)))
    await xfs.writeFilePromise(ppath.join(tempDir, path), body)
  }

  const writeJson = async (target: string, body: Record<string, unknown>) => {
    await writeFile(target, JSON.stringify(body))
  }

  const run = (command: string, { cwd }: RunOptions = {}) => {
    const yarnPath = `${__dirname}/../../.yarn/releases/yarn-3.0.1.cjs`
    const yarnBinary = require.resolve(yarnPath)

    return execFile(process.execPath, [yarnBinary, ...command.split(" ")], {
      cwd: cwd || tempDir,
      env: {
        HOME: homeDir,
        USERPROFILE: homeDir,
        // Otherwise snapshots relying on this would break each time it's bumped
        YARN_CACHE_KEY_OVERRIDE: "0",
        // Otherwise tests fail on systems where this is globally set to true
        YARN_ENABLE_GLOBAL_CACHE: "false",
        // Otherwise the output wouldn't be the same on CI vs non-CI
        YARN_ENABLE_INLINE_BUILDS: "false",
        YARN_ENABLE_PROGRESS_BARS: "false",
        // Otherwise we'd send telemetry event when running tests
        YARN_ENABLE_TELEMETRY: "0",
        // Otherwise the output isn't stable between runs
        YARN_ENABLE_TIMERS: "false",
        YARN_NPM_REGISTRY_SERVER: registryUrl,
        // Otherwise we would more often test the fallback rather than the real logic
        YARN_UNSAFE_HTTP_WHITELIST: new URL(registryUrl).hostname,
      },
    })
  }

  return {
    registry,
    run,
    writeFile,
    writeJson,
  }
}