import { Config } from "folio"
import path from "path"

const config: Config = {
  forbidOnly: !!process.env.CI,
  testDir: path.join(__dirname, "test"),
}

export default config
