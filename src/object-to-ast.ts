import type babelCore from '@babel/core'

type ObjectToASTOptions = {
  babel: typeof babelCore
  fileOptions: babelCore.TransformOptions
}

export default function objectToAST(
  object: unknown,
  {babel, fileOptions}: ObjectToASTOptions,
) {
  const stringified = stringify(object)
  const variableDeclarationNode = babel.template(`var x = ${stringified}`, {
    preserveComments: true,
    placeholderPattern: false,
    ...fileOptions.parserOpts,
    sourceType: 'module',
  })() as babelCore.types.VariableDeclaration

  return variableDeclarationNode.declarations[0].init
}

function stringify(object: unknown) {
  // This check is necessary as `JSON.stringify` can return undefined,
  // however the TypeScript definition for it does not include it.
  // See https://github.com/microsoft/TypeScript/issues/18879 for details.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const str = JSON.stringify(object, stringifyReplacer) ?? 'undefined'

  return str.replace(
    /"__FUNCTION_START__(.*?)__FUNCTION_END__"/g,
    functionReplacer,
  )
  function stringifyReplacer(_key: string, value: unknown) {
    if (typeof value === 'function') {
      return `__FUNCTION_START__${value.toString()}__FUNCTION_END__`
    }
    return value
  }
  function functionReplacer(match: string, p1: string) {
    return p1.replace(/\\"/g, '"').replace(/\\n/g, '\n')
  }
}
