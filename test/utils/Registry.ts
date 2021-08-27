import * as http from "http"
import { AddressInfo } from "net"

type Packages = Record<string, string>

export class Registry {
  public packages: Packages = {}

  async start() {
    return new Promise<string>((resolve) => {
      const server = http.createServer(async (req, res) => {
        console.log(req.url)

        const data = JSON.stringify({
          "dist-tags": { latest: "1.0.0" },
          name: "a",
          versions: [],
        })

        res.writeHead(200, { ["Content-Type"]: "application/json" })
        res.end(data)
      })

      // We don't want the server to prevent the process from exiting
      server.unref()
      server.listen(() => {
        const { port } = server.address() as AddressInfo
        resolve(`http://localhost:${port}`)
      })
    })
  }
}
