import { Config } from "@playwright/test"
import path from "node:path"

const config: Config = {
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  testDir: path.join(__dirname, "test"),
}

export default config
