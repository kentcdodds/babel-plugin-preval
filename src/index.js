const p = require('path')
const babylon = require('babylon')
const requireFromString = require('require-from-string')
// const printAST = require('ast-pretty-print')

module.exports = prevalPlugin

function prevalPlugin({types: t, template, transform}) {
  const assignmentBuilder = template('const NAME = VALUE')
  return {
    name: 'preval',
    visitor: {
      TaggedTemplateExpression(path, {file: {opts: {filename}}}) {
        const isPreval = path.node.tag.name === 'preval'
        if (!isPreval) {
          return
        }
        const string = path.get('quasi').evaluate().value
        if (!string) {
          throw new Error(
            'Unable to determine the value of your preval string',
          )
        }
        const replacement = getReplacement({string, filename})
        path.replaceWith(replacement)
      },
      ImportDeclaration(path, {file: {opts: {filename}}}) {
        const isPreval = looksLike(path, {
          node: {
            source: {
              leadingComments(comments) {
                return comments.some(isPrevalComment)
              },
            },
          },
        })
        if (!isPreval) {
          return
        }
        const prevalComment = path.node.source.leadingComments
          .find(isPrevalComment)
          .value.trim()
        let args
        if (prevalComment !== 'preval') {
          args = prevalComment.replace(/preval\((.*)\)/, '$1').trim()
        }

        const replacement = getReplacement({
          string: `
            try {
              // allow for transpilation of required modules
              require('babel-register')
            } catch (e) {
              // ignore error
            }
            var mod = require('${path.node.source.value}');
            mod = mod && mod.__esModule ? mod.default : mod
            ${args ? `mod = mod(${args})` : ''}
            module.exports = mod
          `,
          filename,
        })
        path.replaceWith(
          assignmentBuilder({
            NAME: t.identifier(path.node.specifiers[0].local.name),
            VALUE: replacement,
          }),
        )
      },
      CallExpression(path, {file: {opts: {filename}}}) {
        const isPreval = looksLike(path, {
          node: {
            callee: {
              type: 'MemberExpression',
              object: {name: 'preval'},
              property: {name: 'require'},
            },
          },
        })
        if (!isPreval) {
          return
        }
        const [source, ...args] = path.get('arguments')
        const argValues = args.map(a => {
          const result = a.evaluate()
          if (!result.confident) {
            throw new Error(
              'preval cannot determine the value of an argument in preval.require',
            )
          }
          return result.value
        })
        const absolutePath = p.join(p.dirname(filename), source.node.value)
        try {
          // allow for transpilation of required modules
          require('babel-register')
        } catch (e) {
          // ignore error
        }
        let mod = require(absolutePath)
        if (argValues.length) {
          if (typeof mod !== 'function') {
            throw new Error(
              `\`preval.require\`-ed module (${source.node
                .value}) cannot accept arguments because it does not export a function. You passed the arguments: ${argValues.join(
                ', ',
              )}`,
            )
          }
          mod = mod(...argValues)
        }
        path.replaceWith(objectToAST(mod))
      },
    },
  }

  function getReplacement({string: stringToPreval, filename}) {
    const {code: transpiled} = transform(stringToPreval, {
      filename,
    })
    const val = requireFromString(transpiled, filename)
    return objectToAST(val)
  }
}

function objectToAST(object) {
  const stringified = stringify(object)
  const fileNode = babylon.parse(`var x = ${stringified}`)
  return fileNode.program.body[0].declarations[0].init
}

function isPrevalComment(comment) {
  return comment.value.trim().split(' ')[0].trim().startsWith('preval')
}

function stringify(object) {
  // if (typeof object === 'string') {
  //   return object
  // }
  return JSON.stringify(object, stringifyReplacer).replace(
    /"__FUNCTION_START__(.*)__FUNCTION_END__"/g,
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

function looksLike(a, b) {
  return (
    a &&
    b &&
    Object.keys(b).every(bKey => {
      const bVal = b[bKey]
      const aVal = a[bKey]
      if (typeof bVal === 'function') {
        return bVal(aVal)
      }
      return isPrimitive(bVal) ? bVal === aVal : looksLike(aVal, bVal)
    })
  )
}

function isPrimitive(val) {
  // eslint-disable-next-line
  return val == null || /^[sbn]/.test(typeof val);
}

/*
eslint
  import/no-unassigned-import:0
  import/no-dynamic-require:0
*/
