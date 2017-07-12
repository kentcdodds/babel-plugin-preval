import path from 'path'
import pluginTester from 'babel-plugin-tester'
import plugin from 'babel-macros'

const projectRoot = path.join(__dirname, '../../')

expect.addSnapshotSerializer({
  print(val) {
    return val.split(projectRoot).join('<PROJECT_ROOT>/')
  },
  test(val) {
    return typeof val === 'string'
  },
})

pluginTester({
  plugin,
  snapshot: true,
  tests: withFilename([
    {
      title: 'as tag',
      code: `
        import preval from '../macro'

        const x = preval\`module.exports = require('./fixtures/compute-one')\`
      `,
    },
    {
      title: 'as function',
      code: `
        const myPreval = require('../macro')

        const x = myPreval(\`
          module.exports = require('./fixtures/identity')({sayHi: () => 'hi'})
        \`)
      `,
    },
    {
      title: 'as jsx',
      code: `
        const Preval = require('../macro')

        const ui = (
          <Preval>
            const fs = require('fs')
            module.exports = fs.readFileSync(require.resolve('./fixtures/fixture1.md'), 'utf8')
          </Preval>
        )
      `,
    },
  ]),
})

/*
 * This adds the filename to each test so you can do require/import relative
 * to this test file.
 */
function withFilename(tests) {
  return tests.map(t => {
    const test = {babelOptions: {filename: __filename}}
    if (typeof t === 'string') {
      test.code = t
    } else {
      Object.assign(test, t)
      test.babelOptions.parserOpts = test.babelOptions.parserOpts || {}
    }
    Object.assign(test.babelOptions.parserOpts, {
      // add the jsx plugin to all tests because why not?
      plugins: ['jsx'],
    })
    return test
  })
}
