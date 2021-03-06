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
    let exitCode = 0

    await cb({
      reportError: (_, msg) => {
        stdout.write(`ERROR: ${msg}\n`)
        exitCode = 1
      },
      reportInfo: (_, msg) => stdout.write(`INFO: ${msg}\n`),
      reportProgress: () => stdout.write("--- PROGRESS ---\n"),
      reportSeparator: () => stdout.write("--- SEPARATOR ---\n"),
      reportWarning: (_, msg) => stdout.write(`WARN: ${msg}\n`),
      async startTimerPromise(msg, cb) {
        stdout.write(msg + "\n")
        await cb()
      },
    })

    return {
      exitCode: () => exitCode,
    }
  },
}
