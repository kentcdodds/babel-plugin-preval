const x = preval`
  const fs = require('fs')
  const val = fs.readFileSync(require.resolve('./fixture1.md'), 'utf8')
  module.exports = {
    val,
    getSplit: function(splitDelimiter) {
      return x.val.split(splitDelimiter)
    }
  }
`
