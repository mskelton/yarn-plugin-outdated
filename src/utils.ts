export const truthy = Boolean as unknown as <T>(
  arg: T | undefined | null | false
) => arg is T
