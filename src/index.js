const requireFromString = require('require-from-string')
const babylon = require('babylon')
// const printAST = require('ast-pretty-print')

module.exports = prevalPlugin

function prevalPlugin(babel) {
  return {
    name: 'preval',
    visitor: {
      TaggedTemplateExpression(path, {file: {opts: {filename}}}) {
        const isPreval = path.node.tag.name === 'preval'
        if (!isPreval) {
          return
        }
        const stringToPreval = path.get('quasi').evaluate().value
        if (!stringToPreval) {
          throw new Error(
            'Unable to determine the value of your preval string',
          )
        }
        const {code: transpiled} = babel.transform(stringToPreval, {
          filename,
        })
        const val = requireFromString(transpiled, filename)

        const stringified = JSON.stringify(val, stringifyReplacer).replace(
          /"__FUNCTION_START__(.*)__FUNCTION_END__"/g,
          functionReplacer,
        )
        const fileNode = babylon.parse(`var x = ${stringified}`)
        const replacement = fileNode.program.body[0].declarations[0].init
        path.replaceWith(replacement)
      },
    },
  }
}

function stringifyReplacer(key, value) {
  if (typeof value === 'function') {
    return `__FUNCTION_START__${value.toString()}__FUNCTION_END__`
  }
  return value
}

function functionReplacer(match, p1) {
  return p1.replace(/\\"/g, '"').replace(/\\n/g, '\n')
}
