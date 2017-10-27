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
  babelOptions: {filename: __filename, parserOpts: {plugins: ['jsx']}},
  tests: [
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
    {
      title: 'error for other nodes',
      error: true,
      code: `
        const preval = require('../macro')

        x = 3 + preval
      `,
    },
  ],
})
