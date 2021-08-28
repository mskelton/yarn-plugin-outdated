import { PortablePath, ppath, xfs } from "@yarnpkg/fslib"
import { stringifySyml } from "@yarnpkg/parsers"
import path from "path"
import { URL } from "url"
import { Registry } from "./Registry"
import { execFile } from "./exec"
import { createLockfile } from "./lockfile"

const YARN_RC = stringifySyml({
  checksumBehavior: "ignore",
  plugins: [path.join(__dirname, "../../bundles/@yarnpkg/plugin-outdated.js")],
})

interface RunOptions {
  cwd?: PortablePath
}

// We only need to setup the registry once
const registry = new Registry()

export async function makeTemporaryEnv() {
  const workspace = "foo"
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

  const writeManifest = async (body: Record<string, unknown>) => {
    await writeFile(
      "package.json",
      JSON.stringify({ name: workspace, ...body })
    )
  }

  const writeLockfile = async (packages: Record<string, string>) => {
    await writeFile("yarn.lock", createLockfile(workspace, packages))
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

  // Write the .yarnrc.yml file with some defaults
  await writeFile(".yarnrc.yml", YARN_RC)

  return {
    registry,
    run,
    writeFile,
    writeLockfile,
    writeManifest,
  }
}
