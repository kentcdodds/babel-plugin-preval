const p = require('path')
const fs = require('fs')
// const printAST = require('ast-pretty-print')
const {getReplacement, requireFromString} = require('./helpers')

module.exports = prevalPlugin

function prevalPlugin(babel) {
  const {types: t, template, transformFromAst} = babel
  const assignmentBuilder = template('const NAME = VALUE')
  return {
    name: 'preval',
    visitor: {
      Program(
        path,
        {
          file: {
            opts: {filename, prevalBabelOptions},
          },
        },
      ) {
        const firstNode = path.node.body[0] || {}
        const comments = firstNode.leadingComments || []
        const isPreval = comments.some(isPrevalComment)

        if (!isPreval) {
          return
        }

        comments.find(isPrevalComment).value = ' this file was prevaled'

        const {code: string} = transformFromAst(
          path.node,
          null,
          /* istanbul ignore next (babel 6 vs babel 7 check) */
          /^6\./.test(babel.version)
            ? {
                ...prevalBabelOptions,
              }
            : {
                filename,
                babelrc: false,
                configFile: false,
                ...prevalBabelOptions,
              },
        )
        const replacement = getReplacement({
          string,
          fileOpts: {filename},
          babel,
        })

        const moduleExports = {
          ...t.expressionStatement(
            t.assignmentExpression(
              '=',
              t.memberExpression(
                t.identifier('module'),
                t.identifier('exports'),
              ),
              replacement,
            ),
          ),
          leadingComments: comments,
        }

        path.replaceWith(t.program([moduleExports]))
      },
      TaggedTemplateExpression(
        path,
        {
          file: {
            opts: {filename},
          },
        },
      ) {
        const isPreval = path.node.tag.name === 'preval'
        if (!isPreval) {
          return
        }
        const string = path.get('quasi').evaluate().value
        if (!string) {
          throw new Error('Unable to determine the value of your preval string')
        }
        const replacement = getReplacement({
          string,
          fileOpts: {filename},
          babel,
        })
        path.replaceWith(replacement)
      },
      ImportDeclaration(
        path,
        {
          file: {
            opts: {filename},
          },
        },
      ) {
        const isPreval = looksLike(path, {
          node: {
            source: {
              leadingComments(comments) {
                return comments && comments.some(isPrevalComment)
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
        let argValues
        if (prevalComment !== 'preval') {
          const arg = prevalComment.replace(/preval\((.*)\)/, '$1').trim()
          const argValue = requireFromString({
            string: `module.exports = ${arg}`,
            fileOpts: {filename},
          })
          argValues = [argValue]
        }

        const absolutePath = p.resolve(
          p.dirname(filename),
          path.node.source.value,
        )
        const code = fs.readFileSync(require.resolve(absolutePath))

        const replacement = getReplacement({
          string: code,
          fileOpts: {filename},
          args: argValues,
          babel,
        })
        path.replaceWith(
          assignmentBuilder({
            NAME: t.identifier(path.node.specifiers[0].local.name),
            VALUE: replacement,
          }),
        )
      },
      CallExpression(
        path,
        {
          file: {
            opts: {filename},
          },
        },
      ) {
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
        const absolutePath = p.resolve(p.dirname(filename), source.node.value)
        const code = fs.readFileSync(require.resolve(absolutePath))

        const replacement = getReplacement({
          string: code,
          fileOpts: {filename},
          args: argValues,
          babel,
        })

        path.replaceWith(replacement)
      },
    },
  }
}

function isPrevalComment(comment) {
  const normalisedComment = comment.value.trim().split(' ')[0].trim()
  return (
    normalisedComment.startsWith('preval') ||
    normalisedComment.startsWith('@preval')
  )
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
  return val == null || /^[sbn]/.test(typeof val)
}

/*
eslint
  import/no-unassigned-import: off,
  import/no-dynamic-require: off,
  max-lines-per-function: off,
*/
