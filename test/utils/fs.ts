import { npath, PortablePath, ppath, xfs } from "@yarnpkg/fslib"
import tarFs from "tar-fs"
import zlib from "zlib"

export async function packToStream(
  source: PortablePath,
  { virtualPath = null }: { virtualPath?: PortablePath | null } = {},
) {
  if (virtualPath) {
    virtualPath = ppath.resolve(virtualPath)
  }

  const zipperStream = zlib.createGzip()
  const packStream = tarFs.pack(npath.fromPortablePath(source), {
    map(header: any) {
      header.name = npath.toPortablePath(header.name)
      header.name = ppath.resolve(PortablePath.root, header.name)
      header.name = ppath.relative(PortablePath.root, header.name)

      if (virtualPath) {
        header.name = ppath.resolve(PortablePath.root, virtualPath, header.name)
        header.name = ppath.relative(PortablePath.root, header.name)
      }

      header.uid = 1
      header.gid = 1
      header.mtime = new Date(1589272747277)

      return header
    },
  })

  packStream.pipe(zipperStream)
  packStream.on("error", (err) => {
    zipperStream.emit("error", err)
  })

  return zipperStream
}

export async function readJson(source: PortablePath) {
  return JSON.parse(await xfs.readFilePromise(source, "utf8"))
}
