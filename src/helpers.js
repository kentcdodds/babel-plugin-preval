const p = require('path')
const requireFromString = require('require-from-string')
const objectToAST = require('./object-to-ast')

module.exports = {
  getReplacement,
  transformAndRequire,
}

function transformAndRequire({
  string: stringToPreval,
  fileOpts,
  args = [],
  babel,
}) {
  const {filename, plugins, presets} = fileOpts
  const {code} = babel.transform(stringToPreval, {
    filename,
    plugins,
    presets,
  })
  let mod = requireFromString(code, filename)
  mod = mod && mod.__esModule ? mod.default : mod

  if (typeof mod === 'function') {
    mod = mod(...args)
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

  return mod
}

function getReplacement({string, fileOpts, args, babel}) {
  const mod = transformAndRequire({string, fileOpts, args, babel})
  return objectToAST(mod, {babel, fileOptions: fileOpts})
}
