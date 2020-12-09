import { CommandContext, Configuration } from "@yarnpkg/core"
import { Command } from "clipanion"
import { printTable } from "../utils/table"

export class OutdatedCommand extends Command<CommandContext> {
  @Command.Boolean("-a,--all")
  all = false

  @Command.Boolean("-w,--wanted")
  wanted = false

  @Command.Path("outdated")
  async execute() {
    const configuration = await Configuration.find(
      this.context.cwd,
      this.context.plugins
    )

    printTable(configuration, [])
  }
}
