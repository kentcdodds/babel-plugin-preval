const preval = require('../../../macro')

if (preval`module.exports = true`) {
  module.exports = 6
} else {
  module.exports = 'not 6'
}
