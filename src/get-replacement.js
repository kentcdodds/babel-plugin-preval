const requireFromString = require('require-from-string')
const objectToAST = require('./object-to-ast')

module.exports = getReplacement

function getReplacement({string: stringToPreval, filename, babel}) {
  const {code: transpiled} = babel.transform(stringToPreval, {
    filename,
  })
  const val = requireFromString(transpiled, filename)
  return objectToAST(val)
}
