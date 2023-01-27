import { Plugin, SettingsType } from "@yarnpkg/core"
import { OutdatedCommand } from "./OutdatedCommand.mjs"

declare module "@yarnpkg/core" {
  interface ConfigurationValueMap {
    outdatedIncludeUrl: boolean
  }
}

const plugin: Plugin = {
  commands: [OutdatedCommand],
  configuration: {
    outdatedIncludeUrl: {
      default: false,
      description: `If true, the outdated command will include the package homepage URL by default`,
      type: SettingsType.BOOLEAN as const,
    },
  },
}

export default plugin
