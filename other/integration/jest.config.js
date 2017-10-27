const jestConfig = require('kcd-scripts/config').jest

module.exports = Object.assign(jestConfig, {
  roots: [__dirname],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: ['fixtures/**/*.js'],
  coverageThreshold: null,
})
