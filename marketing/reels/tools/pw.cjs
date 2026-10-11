// Playwright from this project if installed, else the global copy in the Claude Code cloud container
// (or wherever PLAYWRIGHT_MODULE points).
try {
  module.exports = require('playwright');
} catch {
  module.exports = require(process.env.PLAYWRIGHT_MODULE || '/opt/node22/lib/node_modules/playwright');
}
