import fs from "fs"
import path from "path"

export function readLockfile(filename: string) {
  return fs.readFileSync(
    path.join(__dirname, "..", "lockfiles", filename),
    "utf8"
  )
}
