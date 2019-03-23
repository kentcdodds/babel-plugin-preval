/**
 * 🐣 Pre-evaluate code at build-time
 *
 * @param template A well-formed template string of code.
 * @param substitutions A set of substitution values.
 *
 * ---
 *
 * Important notes:
 * * All code run by preval is not run in a sandboxed environment
 * * All code must run synchronously.
 * * Code that is run by preval is not transpiled so it must run natively in the version of node you're running. (cannot use es modules).
 *
 * ---
 *
 * @example
 *
 * ```ts
 * import preval from 'babel-plugin-preval/macro'
 * const two = '2'
 * const one = preval`module.exports = 1 + ${two} - 1 - 1`
 * //      ↓ ↓ ↓ ↓ ↓ ↓
 * const two = '2'
 * const one = 1
 * ```
 */

declare const preval: <T = any>(
  template: TemplateStringsArray,
  ...substitutions: any[]
) => T

export default preval
