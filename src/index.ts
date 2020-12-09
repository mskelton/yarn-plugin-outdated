import { Plugin } from "@yarnpkg/core"
import { OutdatedCommand } from "./OutdatedCommand"

const plugin: Plugin = {
  commands: [OutdatedCommand],
}

export default plugin
