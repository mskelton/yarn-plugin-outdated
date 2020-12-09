try {
  module.exports = require("../bundles/@yarnpkg/plugin-outdated.js")
} catch (e) {
  // Provide a noop plugin if the bundle hasn't been built yet. This fixes the
  // chicken and egg problem of needing Yarn to build the plugin and needing
  // the plugin for Yarn to work.
  module.exports = {
    factory: () => ({}),
    name: "yarn-outdated",
  }
}
