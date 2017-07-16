# Examples

## Usage with React/Next.js

### Use node's os module to get the user that ran the build and display their username.

```jsx
import React from 'react'
import preval from 'preval.macro'

const whoami = preval`
  const userInfo = require('os').userInfo()
  module.exports = userInfo.username
`

export default WhoAmI

function WhoAmI () {
  return (
    <div style={{display: 'flex', justifyContent: 'center'}}>
      <h1>
        <pre>
          whoami: {whoami}
        </pre>
      </h1>
    </div>
  )
}
```

### Code reuse with babel-plugin-preval (Especially useful with [Next.js](https://github.com/zeit/next.js))

A small `getPosts.js` node module that loads in markdown files in a "posts" directory.
```js
const frontMatter = require('yaml-front-matter');
const fs = require('fs');
const path = require('path');

const posts = fs
  .readdirSync('./posts/')
  .filter(file => path.extname(file) === '.md')
  .map(file => frontMatter.loadFront(`./posts/${file}`, 'body'));

module.exports = posts || [];
```

Preval the `getPosts.js` module so that posts are loaded and exported.
```js
import preval from 'preval.macro';

export default preval`module.exports = require('./getPosts')`;
```

Now you can import the above posts and use a module like [marked](https://github.com/chjj/marked) to convert your markdown into blog posts! The underlying `getPosts.js` module can also be used required in `next.config.js` to build the static list of routes for `next export`. See the full example in the [Next Static](https://github.com/infiniteluke/next-static) project.
