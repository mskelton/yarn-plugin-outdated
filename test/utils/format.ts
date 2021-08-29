export function prettyJSON(data: string) {
  return JSON.stringify(JSON.parse(data), null, 2)
}
