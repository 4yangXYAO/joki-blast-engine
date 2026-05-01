// Dev starter placed inside the project so Node can resolve project deps.
// It registers dotenv and ts-node so we can require TypeScript modules directly.
try {
  require('dotenv').config()
} catch (e) {
  // ignore if dotenv isn't present
}

// Register ts-node to allow requiring .ts files
try {
  require('ts-node/register/transpile-only')
} catch (e) {
  // If ts-node isn't installed, let the error surface when requiring server
}

const { startServer } = require('../src/api/server')

startServer()
