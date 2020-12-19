import { formatUtils, Project } from "@yarnpkg/core"
import { suggestUtils } from "@yarnpkg/plugin-essentials"
import { Cli } from "clipanion"
import getStream from "get-stream"
import { PassThrough } from "stream"
import { structUtils } from "../__mocks__/@yarnpkg/core"
import { OutdatedCommand } from "../src/OutdatedCommand"

beforeEach(() => {
  formatUtils.pretty.mockImplementation((_, string) => string)
})

const dependenciesToMap = (obj = {}) =>
  new Map(
    Object.entries(obj).map(([key, range]) => {
      const parts = key.replace("@", "").split("/")

      return [
        key,
        {
          name: parts[1] || parts[0],
          range,
          scope: parts.length > 1 ? parts[0] : null,
        },
      ]
    })
  )

const createWorkspace = (manifest) => ({
  computeCandidateName: () => "computed-name",
  manifest: {
    ...manifest,
    dependencies: dependenciesToMap(manifest.dependencies),
    devDependencies: dependenciesToMap(manifest.devDependencies),
  },
})

function setupMock({ candidates, manifest, manifests }) {
  suggestUtils.fetchDescriptorFrom.mockImplementation((descriptor) => ({
    range: candidates[structUtils.stringifyIdent(descriptor)],
  }))

  Project.find.mockResolvedValue({
    project: {
      cwd: "nowhere",
      workspaces: (manifests || []).map(createWorkspace),
    },
    workspace: createWorkspace(manifest || {}),
  })
}

export async function run(command, mockData) {
  setupMock(mockData)
  const stream = new PassThrough()
  const cli = Cli.from([OutdatedCommand])

  const exitCode = await cli.run(command.split(" "), {
    stderr: stream,
    stdout: stream,
  })

  stream.end()
  const output = await getStream(stream)

  if (exitCode !== 0) {
    throw new Error(output)
  }

  return output
}
