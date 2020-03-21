// const printAST = require('ast-pretty-print')
const {createMacro} = require('babel-plugin-macros')
const {getReplacement} = require('./helpers')

module.exports = createMacro(prevalMacros)

function prevalMacros({references, state, babel}) {
  references.default.forEach(referencePath => {
    if (referencePath.parentPath.type === 'TaggedTemplateExpression') {
      asTag(referencePath.parentPath.get('quasi'), state, babel)
    } else if (referencePath.parentPath.type === 'CallExpression') {
      asFunction(referencePath.parentPath.get('arguments'), state, babel)
    } else if (referencePath.parentPath.type === 'JSXOpeningElement') {
      asJSX(
        {
          attributes: referencePath.parentPath.get('attributes'),
          children: referencePath.parentPath.parentPath.get('children'),
        },
        state,
        babel,
      )
    } else if (referencePath.parentPath.type === 'JSXClosingElement') {
      // That's okay, we already prevaled this one on its opening element.
    } else {
      throw new Error(
        `babel-plugin-preval/macro can only be used as tagged template expression, function call or JSX element. You tried ${referencePath.parentPath.type}.`,
      )
    }
  })
}

function asTag(quasiPath, {file: {opts: fileOpts}}, babel) {
  const string = quasiPath.parentPath.get('quasi').evaluate().value
  quasiPath.parentPath.replaceWith(
    getReplacement({
      string,
      fileOpts,
      babel,
    }),
  )
}

function asFunction(argumentsPaths, {file: {opts: fileOpts}}, babel) {
  const string = argumentsPaths[0].evaluate().value
  argumentsPaths[0].parentPath.replaceWith(
    getReplacement({
      string,
      fileOpts,
      babel,
    }),
  )
}

// eslint-disable-next-line no-unused-vars
function asJSX({attributes, children}, {file: {opts: fileOpts}}, babel) {
  // It's a shame you cannot use evaluate() with JSX
  const string = children[0].node.value
  children[0].replaceWith(
    getReplacement({
      string,
      fileOpts,
      babel,
    }),
  )
  const {
    parentPath: {
      node: {openingElement, closingElement},
    },
  } = children[0]
  openingElement.name.name = 'div'
  closingElement.name.name = 'div'
}
