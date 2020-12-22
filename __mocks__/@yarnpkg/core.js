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
