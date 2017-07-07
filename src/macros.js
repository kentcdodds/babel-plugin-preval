// const printAST = require('ast-pretty-print')
const getReplacement = require('./get-replacement')

// this implements the babel-macros v0.2.0 API
module.exports = {asTag, asFunction, asJSX}

function asTag(quasiPath, {file: {opts: {filename}}}) {
  const string = quasiPath.parentPath.get('quasi').evaluate().value
  quasiPath.parentPath.replaceWith(
    getReplacement({
      string,
      filename,
    }),
  )
}

function asFunction(argumentsPaths, {file: {opts: {filename}}}) {
  const string = argumentsPaths[0].evaluate().value
  argumentsPaths[0].parentPath.replaceWith(
    getReplacement({
      string,
      filename,
    }),
  )
}

// eslint-disable-next-line no-unused-vars
function asJSX({attributes, children}, {file: {opts: {filename}}}) {
  // It's a shame you cannot use evaluate() with JSX
  const string = children[0].node.value
  children[0].replaceWith(
    getReplacement({
      string,
      filename,
    }),
  )
  const {
    parentPath: {node: {openingElement, closingElement}},
  } = children[0]
  openingElement.name.name = 'div'
  closingElement.name.name = 'div'
}
