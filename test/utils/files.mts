import fs from "fs"
import path from "path"

export function readSupplementalFile(filename: string) {
  return fs.readFileSync(path.join(__dirname, "..", "files", filename), "utf8")
}
