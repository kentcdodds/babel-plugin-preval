const x = preval`
  const fs = require('fs')
  const val = fs.readFileSync(__dirname + '/fixture1.md', 'utf8')
  module.exports = {
    val,
    getSplit: function(splitDelimiter) {
      return x.val.split(splitDelimiter)
    }
  }
`
