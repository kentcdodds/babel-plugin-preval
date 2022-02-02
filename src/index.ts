import p from 'path'
import fs from 'fs'
import type babelCore from '@babel/core'
import type {Primitive} from 'type-fest'
import {getReplacement, requireFromString} from './helpers'

type VisitorState = {
  file: {
    opts: babelCore.TransformOptions
  }
}

export default function prevalPlugin(
  babel: typeof babelCore,
): babelCore.PluginObj<VisitorState> {
  const {types: t, template, transformFromAst} = babel
  const assignmentBuilder = template('const NAME = VALUE')
  return {
    name: 'preval',
    visitor: {
      Program(path, {file: {opts: fileOpts}}) {
        const firstNode = path.node.body[0] || {}
        const comments = firstNode.leadingComments ?? []
        const prevalComment = comments.find(isPrevalComment)

        if (!prevalComment) {
          return
        }

        prevalComment.value = ' this file was prevaled'

        // @ts-expect-error the types for this is wrong...
        const {code: string}: {code: string} = transformFromAst(
          path.node,
          // @ts-expect-error the types for this is wrong...
          null,
          /* istanbul ignore next (babel 6 vs babel 7 check) */
          babel.version.startsWith('6.')
            ? {}
            : {
                babelrc: false,
                configFile: false,
              },
        )

        const replacement = getReplacement({string, fileOpts, babel})

        // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
        if (!replacement) return

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
      TaggedTemplateExpression(path, {file: {opts: fileOpts}}) {
        const isPreval =
          path.node.tag.type === 'Identifier' && path.node.tag.name === 'preval'
        if (!isPreval) {
          return
        }
        const string: unknown = path.get('quasi').evaluate().value
        if (typeof string !== 'string') {
          throw new Error('Unable to determine the value of your preval string')
        }
        const replacement = getReplacement({string, fileOpts, babel})

        // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
        if (!replacement) return

        path.replaceWith(replacement)
      },
      ImportDeclaration(path, {file: {opts: fileOpts}}) {
        const isPreval = looksLike(path, {
          node: {
            source: {
              leadingComments(
                comments: typeof path.node.source.leadingComments,
              ) {
                // istanbul ignore next because the ?? false should never happen
                // because "comments" should never be null, but the types say it could...
                return comments?.some(isPrevalComment) ?? false
              },
            },
          },
        })
        if (!isPreval) {
          return
        }
        const prevalComment = path.node.source.leadingComments
          ?.find(isPrevalComment)
          ?.value.trim()

        // istanbul ignore next because we don't even call `asImportDeclaration` if
        // there's not a codegen comment, but TypeScript gets mad otherwise
        if (!prevalComment) return

        let argValues
        if (prevalComment !== 'preval') {
          const arg = prevalComment.replace(/preval\((.*)\)/, '$1').trim()
          const argValue = requireFromString({
            string: `module.exports = ${arg}`,
            fileOpts,
          })
          argValues = [argValue]
        }

        // istanbul ignore next because I don't know how to reproduce a situation
        // where the filename doesn't exist, but TypeScript gets mad when I don't handle that case.
        if (!fileOpts.filename) return

        const absolutePath = p.resolve(
          p.dirname(fileOpts.filename),
          path.node.source.value,
        )
        const code = fs.readFileSync(require.resolve(absolutePath))

        const replacement = getReplacement({
          string: code,
          fileOpts,
          args: argValues,
          babel,
        })

        const assignment = assignmentBuilder({
          NAME: t.identifier(path.node.specifiers[0].local.name),
          VALUE: replacement,
        })

        // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
        if (!Array.isArray(assignment)) {
          path.replaceWith(assignment)
        }
      },
      CallExpression(path, {file: {opts: fileOpts}}) {
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

        // istanbul ignore next because I don't know how to reproduce a situation
        // where the filename doesn't exist or source.node.type is not StringLiteral,
        // but TypeScript gets mad when I don't handle that case.
        if (!fileOpts.filename || source.node.type !== 'StringLiteral') return

        const absolutePath = p.resolve(
          p.dirname(fileOpts.filename),
          source.node.value,
        )
        const code = fs.readFileSync(require.resolve(absolutePath))

        const replacement = getReplacement({
          string: code,
          fileOpts,
          args: argValues,
          babel,
        })

        // istanbul ignore next because this should never happen, but TypeScript needs me to handle it
        if (!replacement) return

        path.replaceWith(replacement)
      },
    },
  }
}

function isPrevalComment(comment: babelCore.types.Comment) {
  const normalisedComment = comment.value.trim().split(' ')[0].trim()
  return (
    normalisedComment.startsWith('preval') ||
    normalisedComment.startsWith('@preval')
  )
}

// really difficult (impossible?) to make this work with explicit types
// but if I could, I would make it this:
// type LooksLikeTarget = Primitive | Function | {[key: string]: LooksLikeTarget}
type LooksLikeTarget = any

type LooksLikeMatch =
  | Primitive
  | ((a: LooksLikeTarget) => boolean)
  | {[key: string]: LooksLikeMatch}

function looksLike(a: LooksLikeTarget, b: LooksLikeMatch): boolean {
  if (isPrimitive(b)) return a === b
  if (typeof b === 'function') return b(a)

  // istanbul ignore next because we don't have this use case
  // but if anyone copy/pastes this handy utility, they might need it!
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  if (isPrimitive(a) || typeof a === 'function') return false

  return Object.keys(b).every(bKey => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return looksLike(a[bKey], b[bKey])
  })
}

function isPrimitive(
  val: Function | Primitive | {[key: string]: unknown},
): val is Primitive {
  // eslint-disable-next-line
  return val == null || /^[sbn]/.test(typeof val)
}

/*
eslint
  @typescript-eslint/no-explicit-any: off,
  import/no-unassigned-import: off,
  import/no-dynamic-require: off,
  max-lines-per-function: off,
*/
