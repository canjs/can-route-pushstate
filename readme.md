# can-route-pushstate

[![Build Status](https://travis-ci.org/canjs/can-route-pushstate.png?branch=master)](https://travis-ci.org/canjs/can-route-pushstate)

> Pushstate for can-route


- <code>[__can-route-pushstate__ Object](#can-route-pushstate-object)</code>

## API

##  `{Object}`

Changes [can-route](https://github.com/canjs/can-route) to use [pushstate](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history)
to change the window's [pathname](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.pathname) instead
of the [hash](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.hash).

```js
var route = require("can-route-pushstate");

route(":page", { page: "home" });
route.ready();

route.attr("page", "user");

location.pathname; // -> "/user"
```




### <code>Object</code>

- __The__ <code>{Object}</code>:
  pushstate object comprises several properties that configure the behavior of [can-route] to work with `history.pushstate`.
  
## Contributing

### Making a Build

To make a build of the distributables into `dist/` in the cloned repository run

```
npm install
node build
```

### Running the tests

Tests can run in the browser by opening a webserver and visiting the `test.html` page.
Automated tests that run the tests from the command line in Firefox can be run with

```
npm test
```
