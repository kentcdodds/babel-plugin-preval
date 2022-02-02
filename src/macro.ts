// const printAST = require('ast-pretty-print')
import type babelCore from '@babel/core'
import {createMacro} from 'babel-plugin-macros'
import type {MacroHandler} from 'babel-plugin-macros'
import {getReplacement} from './helpers'

const prevalMacros: MacroHandler = function prevalMacros({
  references,
  state,
  babel,
}) {
  const fileOpts = state.file.opts
  references.default.forEach(referencePath => {
    const path = referencePath as babelCore.NodePath<babelCore.types.Identifier>
    const targetPath = path.parentPath
    if (targetPath.type === 'TaggedTemplateExpression') {
      asTag(
        targetPath as babelCore.NodePath<babelCore.types.TaggedTemplateExpression>,
        fileOpts,
        babel,
      )
    } else if (targetPath.type === 'CallExpression') {
      asFunction(
        targetPath as babelCore.NodePath<babelCore.types.CallExpression>,
        fileOpts,
        babel,
      )
    } else if (targetPath.type === 'JSXOpeningElement') {
      const jsxElement = targetPath.parentPath
      asJSX(
        jsxElement as babelCore.NodePath<babelCore.types.JSXOpeningElement>,
        fileOpts,
        babel,
      )
    } else if (targetPath.type === 'JSXClosingElement') {
      // That's okay, we already prevaled this one on its opening element.
    } else {
      throw new Error(
        `babel-plugin-preval/macro can only be used as tagged template expression, function call or JSX element. You tried ${targetPath.type}.`,
      )
    }
  })
}

function asTag(
  path: babelCore.NodePath<babelCore.types.TaggedTemplateExpression>,
  fileOpts: babelCore.TransformOptions,
  babel: typeof babelCore,
) {
  const string = path.get('quasi').evaluate().value as string
  const replacement = getReplacement({
    string,
    fileOpts,
    babel,
  })

  // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
  if (!replacement) return

  path.replaceWith(replacement)
}

function asFunction(
  path: babelCore.NodePath<babelCore.types.CallExpression>,
  fileOpts: babelCore.TransformOptions,
  babel: typeof babelCore,
) {
  const argumentsPaths = path.get('arguments')
  const string = argumentsPaths[0].evaluate().value as string
  const replacement = getReplacement({
    string,
    fileOpts,
    babel,
  })

  // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
  if (!replacement) return

  argumentsPaths[0].parentPath.replaceWith(replacement)
}

// eslint-disable-next-line no-unused-vars
function asJSX(
  path: babelCore.NodePath<babelCore.types.JSXOpeningElement>,
  fileOpts: babelCore.TransformOptions,
  babel: typeof babelCore,
) {
  const children = path.get('children') as Array<
    babelCore.NodePath<babelCore.types.JSXExpressionContainer>
  >
  // It's a shame you cannot use evaluate() with JSX
  // @ts-expect-error value isn't on all nodes
  const string = children[0].node.value as string
  const replacement = getReplacement({
    string,
    fileOpts,
    babel,
  })

  // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
  if (!replacement) return

  children[0].replaceWith(replacement)
  const {
    parentPath: {
      // @ts-expect-error OpeningElement and ClosingElement not present on all nodes
      node: {openingElement, closingElement},
    },
  } = children[0]

  openingElement.name.name = 'div'
  closingElement.name.name = 'div'
}

declare function preval(
  literals: TemplateStringsArray,
  ...interpolations: Array<unknown>
): any

declare function preval(code: string): any

// eslint-disable-next-line @typescript-eslint/no-namespace
declare namespace preval {
  function require(modulePath: string, ...args: Array<unknown>): any
}

export default createMacro(prevalMacros) as typeof preval
/*
eslint
  @typescript-eslint/no-explicit-any: "off",
  @typescript-eslint/no-unsafe-member-access: "off",
*/
