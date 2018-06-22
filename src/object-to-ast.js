module.exports = objectToAST

function objectToAST(object, {babel, fileOptions}) {
  const stringified = stringify(object)
  const variableDeclarationNode = babel.template(`var x = ${stringified}`, {
    preserveComments: true,
    placeholderPattern: false,
    ...fileOptions.parserOpts,
    sourceType: 'module',
  })()
  return variableDeclarationNode.declarations[0].init
}

function stringify(object) {
  let str = JSON.stringify(object, stringifyReplacer)
  if (str === undefined) {
    str = 'undefined'
  }
  return str.replace(
    /"__FUNCTION_START__(.*?)__FUNCTION_END__"/g,
    functionReplacer,
  )
  function stringifyReplacer(key, value) {
    if (typeof value === 'function') {
      return `__FUNCTION_START__${value.toString()}__FUNCTION_END__`
    }
    return value
  }
  function functionReplacer(match, p1) {
    return p1.replace(/\\"/g, '"').replace(/\\n/g, '\n')
  }
}
