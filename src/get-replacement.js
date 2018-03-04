const requireFromString = require('require-from-string')
const objectToAST = require('./object-to-ast')

module.exports = getReplacement

function getReplacement({string: stringToPreval, filename, babel}) {
  const {code} = babel.transform(stringToPreval, {
    filename,
  })
  const transpiled = `require('babel-register');\n${code}`
  const val = requireFromString(transpiled, filename)
  return objectToAST(val)
}
