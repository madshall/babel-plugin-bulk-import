# babel-plugin-bulk-import
Babel plugin for bulk import. It will be useful for modular client-side (or both client- and server-side) projects. Server-side projects can hardly benefit from this plugin as what it does can be easily done with `fs` or `glob` modules directly.

Usually, in modular systems it's either modules register themselves within the engine's exposed endpoints or the engine discovers modules 
(plugins) on its own. Both approaches have their drawbacks, especially when it's time for your project to be **Webpack**'ed. 

It would be fair to say that this plugin provides some sort of automation when new modules/features/plugins are created. I'm sure you have your own use-case for this, but here's mine, as an example:

## Project structure
```
.
├── modules
|   ├── landing
|   |   └── features
|   └── profile
|       └── features
└── src
    └── index.js
```

## Goal
What I want to achieve is that whenever a new module is created in `./modules` directory I want it to be injected into my engine (`./src/index.js`) with as fewer manual actions as possible.

## Problem
In order to minimize amount of manual work and, obviously, number of potential bugs, I'd go with my engine being discovering all available modules automatically. This can be easily done by scanning the `./modules` directory and importing each one's `features`. However, when you do that, webpack won't pack these imports and deliver them to client-side app. 

## Solution
Transpile dynamic imports as soon as they appear in the code. And this is what this plugin does.

# Installation
```
npm install  babel-plugin-bulk-import --save-dev
```

In your `.babelrc` add the plugin:
```
{
  "presets": ["es2015"],
  "plugins": ["babel-plugin-bulk-import"]
}

```

# Usage
This plugin uses [glob](https://github.com/isaacs/node-glob) npm module for discovery so refer to its documentation for clues about path syntax. 
Let's assume we have two files:
```
// ./features/featureA.js
module.exports = {
    feature: 'A'
};

// ./features/featureB.js
module.exports = {
    feature: 'B'
};
```
We're all used to
```
import Stuff from './features/featureA.js';
import AnotherStuff from './features/featureB.js';
```
but now you can just do
```
import * as Features from './features/*.js'
/* Features would be
    {
        featureA: {feature: 'A'},
        featureB: {feature: 'B'}
    }
*/
```
or
```
import {featureA as Stuff, featureB as AnotherStuff} from './features/*.js'
/* Stuff would be
    {
        feature: 'A'
    }
*/
/* AnotherStuff would be
    {
        feature: 'B'
    }
*/
```

# Examples
Test case: 
```
.
├── case
|   ├── subfolder
|   |   └── case3.js // module.exports = { case: 999 };
|   ├── case1.js     // module.exports = { case: 1 };
|   ├── case2.js     // module.exports = { case: 2 };
|   └── case3.js     // module.exports = { case: require('./subfolder/case3') };
└── src
    └── index.js
```

## Example #1 (local imports)
```
import * as all from './case/**/*.js';
```
will result in:
```
all = {
    case: { 
        case1: { case: 1 },
        case2: { case: 2 },
        case3: { case: { case: 999 } },
        subfolder: { case3: { case: 999 } } 
    }    
}
```

## Example #2 (imports from node_modules)
```
import * as all from 'lodash/{*,**/*}.js';
```
will result in:
```
all = {
    node_modules : {
        lodash: {
            LODASH_MODULE1: ITS_EXPORT_CONTENTS
            LODASH_MODULE2: ITS_EXPORT_CONTENTS
            ...
        }
    }
}
```

## Example #3 (collisions)
```
import {case1 as C1, case2 as C2, case3 as C3, subfolder as S} from './case/**/*.js';
```
will result in:
```
C1 = {
    case: 1
}

C2 = {
    case: 2
}

C3 = {
    case: 999 
}

S = undefined // that's because there was no file subfolder.js found
```

# Summarize
Be carefull with file names. As long as you keep folder and file structure well organized you should not get unexpected results.
 
# License
[MIT](./LICENSE)
If it helps you get your job done with less headache, star the repo, that will let me know it's useful and is worth support. Any suggestions for improvements are always welcomed!