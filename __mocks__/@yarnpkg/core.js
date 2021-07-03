export const Cache = { find: jest.fn() }
export const Configuration = { find: jest.fn() }
export const Project = { find: jest.fn() }

export const structUtils = {
  stringifyIdent: ({ name, scope }) => (scope ? `@${scope}/${name}` : name),
}

export const formatUtils = {
  pretty: jest.fn(),
  prettyList: jest.fn(),
}

export const FormatType = {
  CODE: "CODE",
}

export const MessageName = {
  UNNAMED: "UNNAMED",
}

export const StreamReport = {
  progressViaCounter() {},
  async start({ stdout }, cb) {
    await cb({
      reportInfo: (_, msg) => stdout.write(msg + "\n"),
      reportProgress: () => stdout.write("--- PROGRESS ---\n"),
      reportSeparator: () => stdout.write("--- SEPARATOR ---\n"),
      async startTimerPromise(msg, cb) {
        stdout.write(msg + "\n")
        await cb()
      },
    })
  },
}
