import { PortablePath, ppath, xfs } from "@yarnpkg/fslib"
import { stringifySyml } from "@yarnpkg/parsers"
import path from "node:path"
import { URL } from "node:url"
import { execFile } from "./exec"
import { Registry } from "./Registry"

const YARN_RC = stringifySyml({
  checksumBehavior: "ignore",
  plugins: [path.join(__dirname, "../../bundles/@yarnpkg/plugin-outdated.js")],
})

interface RunOptions {
  cwd?: PortablePath
  env?: Record<string, string>
}

export async function makeTemporaryEnv(
  globalEnv: Record<string, string>,
  latestVersions: Record<string, string>
) {
  const registry = new Registry(latestVersions)

  const [tempDir, homeDir, registryUrl] = await Promise.all([
    xfs.mktempPromise(),
    xfs.mktempPromise(),
    registry.start(),
  ])

  const destroy = async () => {
    await xfs.removePromise(tempDir, { recursive: true })
    await xfs.removePromise(homeDir, { recursive: true })
  }

  const readFile = (source: string) => {
    const path = ppath.join(tempDir, source as PortablePath)
    return xfs.readFilePromise(path, "utf8")
  }

  const writeFile = async (target: string, body: string) => {
    const path = target as PortablePath
    await xfs.mkdirpPromise(ppath.join(tempDir, ppath.dirname(path)))
    await xfs.writeFilePromise(ppath.join(tempDir, path), body)
  }

  const writeJSON = async (target: string, body: Record<string, unknown>) => {
    await writeFile(target, JSON.stringify(body))
  }

  const run = (command: string, { cwd, env }: RunOptions = {}) => {
    const yarnPath = `${__dirname}/../../.yarn/releases/yarn-4.0.2.cjs`
    const yarnBinary = require.resolve(yarnPath)

    return execFile(process.execPath, [yarnBinary, ...command.split(" ")], {
      cwd: cwd || tempDir,
      env: {
        HOME: homeDir,
        USERPROFILE: homeDir,
        // Otherwise snapshots relying on this would break each time it's bumped
        YARN_CACHE_VERSION_OVERRIDE: "0",
        // Otherwise tests fail on systems where this is globally set to true
        YARN_ENABLE_GLOBAL_CACHE: "false",
        // Otherwise the output wouldn't be the same on CI vs non-CI
        YARN_ENABLE_INLINE_BUILDS: "false",
        YARN_ENABLE_PROGRESS_BARS: "false",
        // Otherwise we'd send telemetry event when running tests
        YARN_ENABLE_TELEMETRY: "0",
        // Otherwise the output isn't stable between runs
        YARN_ENABLE_TIMERS: "false",
        YARN_IS_TEST_ENV: "true",
        YARN_NPM_REGISTRY_SERVER: registryUrl,
        // Otherwise we would more often test the fallback rather than the real logic
        YARN_UNSAFE_HTTP_WHITELIST: new URL(registryUrl).hostname,
        ...globalEnv,
        ...env,
      },
    })
  }

  // Write the .yarnrc.yml file with some defaults
  await writeFile(".yarnrc.yml", YARN_RC)

  return {
    cwd: tempDir,
    destroy,
    readFile,
    registry,
    run,
    writeFile,
    writeJSON,
  }
}
