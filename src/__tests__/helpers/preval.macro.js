// this is just here because the import needs to end in "macro" with no extension.
// and if we don't do this, then babel-plugin-macros cannot find the macro.ts file (it's looking for a .js file).
module.exports = require('../../macro.ts')
