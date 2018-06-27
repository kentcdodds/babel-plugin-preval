const p = require('path')
const requireFromStringOfCode = require('require-from-string')
const objectToAST = require('./object-to-ast')

module.exports = {
  getReplacement,
  requireFromString,
}

function requireFromString({
  string: stringToPreval,
  fileOpts: {filename},
  args = [],
}) {
  let mod = requireFromStringOfCode(String(stringToPreval), filename)
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
  const mod = requireFromString({string, fileOpts, args, babel})
  return objectToAST(mod, {babel, fileOptions: fileOpts})
}
