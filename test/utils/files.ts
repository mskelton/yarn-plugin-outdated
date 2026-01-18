import fs from "node:fs/promises"
import path from "node:path"

export function readSupplementalFile(filename: string) {
  return fs.readFile(path.join(__dirname, "..", "files", filename), "utf8")
}

export function writeSupplementalFile(filename: string, content: string) {
  return fs.writeFile(
    path.join(__dirname, "..", "files", filename),
    content,
    "utf8",
  )
}
