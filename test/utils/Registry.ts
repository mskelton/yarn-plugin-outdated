import { npath } from "@yarnpkg/fslib"
import glob from "glob-promise"
import crypto from "node:crypto"
import http from "node:http"
import { AddressInfo } from "node:net"
import path from "node:path"
import { Gzip } from "node:zlib"
import semver from "semver"
import * as fsUtils from "./fs"

type Request =
  | {
      localName: string
      scope?: string
      type: "packageInfo"
    }
  | {
      localName: string
      scope?: string
      type: "packageTarball"
      version?: string
    }

interface PackageEntry {
  packageJson: Record<string, unknown>
  path: string
}

export class Registry {
  static REGEX = {
    package: /^\/(?:(@[^/]+)\/)?([^@/][^/]*)$/,
    tarball: /^\/(?:(@[^/]+)\/)?([^@/][^/]*)\/-\/\2-(.*)\.tgz$/,
  }

  public port: number = null!
  private packages: Map<string, Map<string, PackageEntry>> = null!
  private serverUrl: Promise<string> = null!

  async start() {
    // Packages on the regsitry don't change from test to test,
    // so we only load them once
    if (!this.packages) {
      await this.loadPackages()
    }

    if (!this.serverUrl) {
      this.serverUrl = new Promise<string>((resolve) => {
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
          this.port = (server.address() as AddressInfo).port
          resolve(`http://localhost:${this.port}`)
        })
      })
    }

    return this.serverUrl
  }

  private async loadPackages() {
    this.packages = new Map()

    // Load the registry packages from the packages directory
    const manifests = await glob("**/package.json", {
      cwd: path.join(__dirname, "../packages"),
      realpath: true,
    })

    for (const manifest of manifests) {
      const packageJson = await fsUtils.readJson(npath.toPortablePath(manifest))
      const { name, version } = packageJson

      // Create the package entry if it doesn't exist
      let packageEntry = this.packages.get(name)
      if (!packageEntry) {
        this.packages.set(name, (packageEntry = new Map()))
      }

      packageEntry.set(version, {
        packageJson,
        path: path.dirname(manifest),
      })
    }
  }

  private async process(
    request: Request,
    _: http.IncomingMessage,
    res: http.ServerResponse
  ) {
    const { localName, scope } = request
    const name = scope ? `${scope}/${localName}` : localName

    const packageEntry = this.packages.get(name)
    if (!packageEntry) {
      return this.sendError(res, 404, `Package not found: ${name}`)
    }

    switch (request.type) {
      case "packageInfo": {
        const versions = Array.from(packageEntry.keys())
        const versionEntries = versions.map(async (version) => ({
          [version]: {
            dist: {
              shasum: await this.getPackageArchiveHash(name, version),
              tarball: await this.getPackageHttpArchivePath(name, version),
            },
            name,
            version,
          },
        }))

        const latest = [...packageEntry.values()].reduce((acc, cur) => {
          return cur.packageJson.isLatest
            ? (cur.packageJson.version as string)
            : acc
        }, semver.maxSatisfying(versions, "*"))

        const data = {
          "dist-tags": { latest },
          name,
          versions: Object.assign({}, ...(await Promise.all(versionEntries))),
        }

        res.writeHead(200, { "Content-Type": "application/json" })
        res.end(JSON.stringify(data))
        break
      }

      case "packageTarball": {
        const version = request.version!
        const packageVersionEntry = packageEntry.get(version)

        if (!packageVersionEntry) {
          const message = `Package not found: ${name}@${version}`
          return this.sendError(res, 404, message)
        }

        res.writeHead(200, {
          "Content-Type": "application/octet-stream",
          "Transfer-Encoding": "chunked",
        })

        const packPath = npath.toPortablePath(packageVersionEntry.path)
        const packStream = await fsUtils.packToStream(packPath, {
          virtualPath: npath.toPortablePath("/package"),
        })

        packStream.pipe(res)
        break
      }
    }
  }

  async getPackageArchiveStream(name: string, version: string): Promise<Gzip> {
    const packageEntry = this.packages.get(name)
    if (!packageEntry) {
      throw new Error(`Unknown package "${name}"`)
    }

    const packageVersionEntry = packageEntry.get(version)
    if (!packageVersionEntry)
      throw new Error(`Unknown version "${version}" for package "${name}"`)

    return fsUtils.packToStream(
      npath.toPortablePath(packageVersionEntry.path),
      { virtualPath: npath.toPortablePath(`/package`) }
    )
  }

  async getPackageArchiveHash(
    name: string,
    version: string
  ): Promise<string | Buffer> {
    const stream = await this.getPackageArchiveStream(name, version)

    return new Promise((resolve) => {
      const hash = crypto.createHash("sha1")
      hash.setEncoding("hex")

      // Send the archive to the hash function
      stream.pipe(hash)
      stream.on("end", () => {
        const finalHash = hash.read()
        if (!finalHash) {
          throw new Error("The hash should have been computated")
        }

        resolve(finalHash)
      })
    })
  }

  async getPackageHttpArchivePath(name: string, version: string) {
    const packageEntry = this.packages.get(name)
    if (!packageEntry) {
      throw new Error(`Unknown package "${name}"`)
    }

    const packageVersionEntry = packageEntry.get(version)
    if (!packageVersionEntry) {
      throw new Error(`Unknown version "${version}" for package "${name}"`)
    }

    const localName = name.replace(/^@[^/]+\//, "")
    const serverUrl = await this.serverUrl

    return `${serverUrl}/${name}/-/${localName}-${version}.tgz`
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
