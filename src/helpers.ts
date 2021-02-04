import p from 'path'
import requireFromStringOfCode from 'require-from-string'
import type babelCore from '@babel/core'
import objectToAST from './object-to-ast'

type PrevalModuleExport = unknown | ((...args: Array<any>) => unknown)

type CompiledESModule = {
  __esModule: boolean
  default: PrevalModuleExport
}

function isCompiledESModule(module: unknown): module is CompiledESModule {
  return typeof module === 'object' && module !== null && '__esModule' in module
}

// istanbul ignore next because I don't know how to reproduce a situation
// where the filename doesn't exist, but TypeScript gets mad when I don't handle that case.
const getFilename = (fileOpts: babelCore.TransformOptions): string =>
  fileOpts.filename ?? '"unknown"'

type RequireFromStringOptions = {
  string: string | Buffer
  fileOpts: babelCore.TransformOptions
  args?: any[]
}
export function requireFromString({
  string: stringToPreval,
  fileOpts,
  args = [],
}: RequireFromStringOptions) {
  const filename = getFilename(fileOpts)
  let module = requireFromStringOfCode(String(stringToPreval), filename) as
    | CompiledESModule
    | PrevalModuleExport
    | unknown

  if (isCompiledESModule(module)) {
    // Allow for es modules (default export)
    module = module.default
  }

  if (typeof module === 'function') {
    module = module(...args)
  } else if (args.length) {
    throw new Error(
      `\`preval.require\`-ed module (${p.relative(
        process.cwd(),
        filename,
      )}) cannot accept arguments because it does not export a function. You passed the arguments: ${args.join(
        ', ',
      )}`,
    )
  }

  return module
}

type GetReplacementOptions = {
  string: string | Buffer
  fileOpts: babelCore.TransformOptions
  args?: any[]
  babel: typeof babelCore
}

export function getReplacement({
  string,
  fileOpts,
  args,
  babel,
}: GetReplacementOptions) {
  const module = requireFromString({string, fileOpts, args})
  return objectToAST(module, {babel, fileOptions: fileOpts})
}

/*
eslint
  @typescript-eslint/no-explicit-any: "off",
*/
