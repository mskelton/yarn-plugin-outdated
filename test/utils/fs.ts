import { miscUtils } from "@yarnpkg/core"
import { npath, ppath, xfs } from "@yarnpkg/fslib"
import { PortablePath } from "@yarnpkg/fslib"
import { relative } from "path"
import * as klaw from "klaw"
// import tarFs from "tar-fs"

export const walk = (
  source: PortablePath,
  { filter }: { filter?: string } = {}
): Promise<PortablePath[]> => {
  return new Promise((resolve) => {
    const paths: PortablePath[] = []
    const walker = klaw(npath.fromPortablePath(source), {
      filter: (sourcePath: string) => {
        if (!filter) return true

        const itemPath = npath.toPortablePath(sourcePath)
        const relativePath = ppath.relative(source, itemPath)
        console.log(relativePath)

        return relativePath === filter
      },
    })

    // walker.on("data", ({ path: sourcePath }) => {
    //   const itemPath = npath.toPortablePath(sourcePath)
    //   const relativePath = ppath.relative(source, itemPath)

    //   // if (!filter || miscUtils.filePatternMatch(relativePath, filter))
    //   //   paths.push(relative ? relativePath : itemPath)

    //   return
    // })

    walker.on("end", () => resolve(paths))
  })
}

export async function packToStream(
  source: PortablePath,
  { virtualPath = null }: { virtualPath?: PortablePath | null } = {}
) {
  return ""
}

export async function readJson(source: PortablePath) {
  return JSON.parse(await xfs.readFilePromise(source, "utf8"))
}
