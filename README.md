# PulX

PulX NodeJs Package Manager with ability pull module from url.

## Installation

```bash
npm i -g pulx
```

## Usage

### Install Non NPM package from URL

Lets say you have a javascript file named `index.js` which looks something like this
```js
// index.js

function add(a, b){
    return a + b;
}

module.exports = add;
```

Now You want to use it in another package, what you usually do is that you ship this module to npm then use `npm install` to other side. But with `PulX` you dont need to do that. You can Do Something Like this...

- Create `pulx.json` file in the directory where `index.js` exists
- Write this:
```json
// pulx.json
{
    "name": "add",
    "include": [
        "./index.js"
    ]
}
```

- Then Host the directory.

- Now to use the `add` module, you will have to install it using `pulx install` command in the project.
```bash
pulx install <url-to-pulx.json-file>
```

- Now the module will be installed in `node_modules/add`

- So you can use it by using `require("add")`


> *Easy and Simple Right?* 

### Install NPM Package

Lets say your custom add module wants to use NPM module. `PulX` has a solution to that also. Follow this steps...

- Install the NPM Package
```bash
pulx install @helper-modules/random
```

- Use the NPM Package

```js
// index.js
const random = require("@helper-modules/random");
function add(a, b){
    return a + b + random.number(0, 10);
}

module.exports = add;
```

After that all steps are same.

> **Don't Worry about installation and stuff, PulX is made to handle that**
> *Again Easy and Simple Right?*
