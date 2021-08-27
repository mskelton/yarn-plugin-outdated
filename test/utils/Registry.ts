import { npath } from "@yarnpkg/fslib"
import * as http from "http"
import { AddressInfo } from "net"
import * as path from "path"
import * as semver from "semver"
import * as fsUtils from "./fs"

type Request =
  | {
      type: "packageInfo"
      scope?: string
      localName: string
    }
  | {
      type: "packageTarball"
      scope?: string
      localName: string
      version?: string
    }

interface PackageEntry {
  versions: string[]
}

export class Registry {
  static REGEX = {
    package: /^\/(?:(@[^/]+)\/)?([^@/][^/]*)$/,
    tarball: /^\/(?:(@[^/]+)\/)?([^@/][^/]*)\/-\/\2-(.*)\.tgz$/,
  }

  private packages: Map<string, PackageEntry> = new Map()

  async start() {
    return new Promise<string>((resolve) => {
      const server = http.createServer((req, res) => {
        const request = this.parseRequest(req.url!.replace(/%2f/g, "/"))
        if (!request) {
          return this.sendError(res, 404, `Invalid route: ${req.url}`)
        }

        this.process(request, req, res).catch((error) => {
          this.sendError(res, 500, error.stack)
        })
      })

      // We don't want the server to prevent the process from exiting
      server.unref()
      server.listen(() => {
        const { port } = server.address() as AddressInfo
        resolve(`http://localhost:${port}`)
      })
    })
  }

  private async loadPackages() {
    const packages = new Map()
    const manifests = await fsUtils.walk(
      npath.toPortablePath(npath.join(__dirname, "../fixtures")),
      { filter: "package.json" }
    )

    for (const pkg of manifests) {
      const packageJson = await fsUtils.readJson(pkg)

      const { name, version } = packageJson
      if (name.startsWith(`git-`)) continue

      let packageEntry = packages.get(name)
      if (!packageEntry) packages.set(name, (packageEntry = new Map()))

      packageEntry.set(version, {
        packageJson,
        path: path.dirname(pkg),
      })
    }

    return packages
  }

  private async process(
    request: Request,
    req: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const { localName, scope } = request
    const name = scope ? `${scope}/${localName}` : localName

    const pkg = this.packages.get(name)
    if (!pkg) {
      return this.sendError(res, 404, `Package not found: ${name}`)
    }

    switch (request.type) {
      case "packageInfo": {
        const data = {
          "dist-tags": {
            latest: semver.maxSatisfying(pkg.versions, "*"),
          },
          name,
          versions: await Promise.all(
            pkg.versions.map(async (version) => ({
              [version]: {
                dist: {
                  shasum: "foo",
                  // tarball: await getPackageHttpArchivePath(name, version),
                },
                name,
                version,
              },
            }))
          ),
        }

        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(data))
        break
      }

      case "packageTarball": {
        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Transfer-Encoding": "chunked",
        })

        const packStream = fsUtils.packToStream(
          npath.toPortablePath(packageVersionEntry.path),
          { virtualPath: npath.toPortablePath("/package") }
        )
        packStream.pipe(res)
        break
      }
    }
  }

  private parseRequest(url: string): Request | null {
    let match: RegExpMatchArray | null

    if ((match = url.match(Registry.REGEX.package))) {
      const [, scope, localName] = match
      return { localName, scope, type: "packageInfo" }
    }

    if ((match = url.match(Registry.REGEX.tarball))) {
      const [, scope, localName, version] = match
      return { localName, scope, type: "packageTarball", version }
    }

    return null
  }

  private sendError(
    res: http.ServerResponse,
    statusCode: number,
    errorMessage: string
  ) {
    res.writeHead(statusCode)
    res.end(errorMessage)
  }
}
