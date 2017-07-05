import pluginTester from 'babel-plugin-tester'
import plugin from '../'

pluginTester({
  plugin,
  snapshot: true,
  tests: [
    {
      snapshot: false,
      code: 'const x = notPreval`module.exports = "nothing"`;',
    },
    'const x = preval`module.exports = 1`',
    'preval`module.exports = "foo"`',
    `
      const y = preval\`
        module.exports = {
          booyah: function() {
            return "booyah"
          }
        }
      \`
    `,
    {fixture: fixture('a-bunch-of-checks')},
    {fixture: fixture('transpiled')},
    {
      code: `const x = preval\`module.exports = "\${dynamic}"\``,
      error: true,
    },

    // please add a file for your use-case
    // in the `fixtures` directory and make
    // a copy of this that points to your file.
    // Then run `npm start test.update`
    // {fixture: fixture('')},
  ],
})

function fixture(filename) {
  return require.resolve(`./fixtures/${filename}`)
}
