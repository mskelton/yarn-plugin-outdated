import { Plugin } from "@yarnpkg/core"
import { OutdatedCommand } from "./commands/OutdatedCommand"

const plugin: Plugin = {
  commands: [OutdatedCommand],
}

export default plugin
