/* eslint-disable */
// codegen can't accept non-transpiled esmodules
// but it can handle transpiled esmodules
// so we're simulating a pre-transpiled module here
Object.defineProperty(exports, '__esModule', {
  value: true,
})

exports.default = function(input) {
  return input
}
