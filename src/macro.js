/* istanbul ignore next */
// const printAST = require('ast-pretty-print')
const {createMacro} = require('babel-macros')
const getReplacement = require('./get-replacement')

module.exports = createMacro(prevalMacros)

function prevalMacros({references, state}) {
  references.default.forEach(referencePath => {
    if (referencePath.parentPath.type === 'TaggedTemplateExpression') {
      asTag(referencePath.parentPath.get('quasi'), state)
    } else if (referencePath.parentPath.type === 'CallExpression') {
      asFunction(referencePath.parentPath.get('arguments'), state)
    } else if (referencePath.parentPath.type === 'JSXOpeningElement') {
      asJSX(
        {
          attributes: referencePath.parentPath.get('attributes'),
          children: referencePath.parentPath.parentPath.get('children'),
        },
        state,
      )
    } else {
      // TODO: throw a helpful error message
    }
  })
}

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
  const {parentPath: {node: {openingElement, closingElement}}} = children[0]
  openingElement.name.name = 'div'
  closingElement.name.name = 'div'
}
