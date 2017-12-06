@module {Object} can-route-pushstate
@parent can-routing
@collection can-core
@package ./package.json
@group can-route-pushstate.static static

@description Changes [can-route] to use
[pushstate](https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Manipulating_the_browser_history)
to change the window's [pathname](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.pathname) instead
of the [hash](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.hash).

```js
var route = require("can-route-pushstate");

route("{page}", { page: "home" });
route.ready();

route.attr("page", "user");

location.pathname; // -> "/user"
```

@option {Object} The pushstate object comprises several properties that configure the behavior of [can-route] to work with `history.pushstate`.

@body

## Use

can-route-pushstate uses the same API as [can-route]. To start using can-route-pushstate all you need is to import `can-route-pushstate`, it will set itself as default binding on [can-route].

You can check current binding by inspecting `route.currentBinding`; the default value is `"hashchange"`.

### Creating and changing routes

To create routes use `route(url, defaults)` like:

```js
route("{page}", {page: 'homepage'});
route("contacts/{username}");
route("books/{genre}/{author}");

route.ready(); // Initializes can-route
```

Do not forget to [can-route.ready initialize] can-route after creating all routes, do it by calling `route.ready()`.

List of defined routes is contained in `route.routes`, you can examine current route state by calling:

```js
route.attr(); //-> {page: "homepage", route: "{page}"}
```

After creating routes and initializing can-route you can update current route by calling `route.attr(attr, newVal)`:

```js
route.attr('page', 'about');
route.attr(); //-> {page: "about", route: "{page}"}

// without cleaning current route state
route.attr('username', 'veljko');
route.attr(); //-> {page: "about", route: "{page}", username: 'veljko'}

// with cleaning current can-route state
route.attr({username: 'veljko'}, true);
route.attr(); //-> {username: "veljko", route: "contacts/{username}"}
```

To update multiple attributes at once pass hash of attributes to `route.attr(hashOfAttrs, true)`. Pass `true` as second argument to clean up current state.

```js
route.attr({genre: 'sf', author: 'adams'}, true);
route.attr(); //-> {genre: "sf", author: "adams", route: "books/{genre}/{author}"}
```

`window.location` acts as expected:

```js
window.location.pathname; //-> "/books/sf/adams"
window.location.hash; //-> "", hash remains unchanged
```

To generate urls use `route.url({attrs})`:

```js
route.url({username: 'justinbmeyer'}); //-> '/contacts/justinbmeyer'
```

### Listening changes on matched route

As can-route contains a map that represents `window.location.pathname`, you can bind on it.

To bind to specific attributes on can-route:

```js
route.bind('username', function(ev, newVal, oldVal) {
	//-> ev:     {EventObject}
	//-> newVal: 'nikica'
	//-> oldVal: 'veljko'
});

route.attr({username: nikica}, true);
```

### Using different pathname root

can-route-pushstate has one additional property, `route.bindings.pushstate.root`, which specifies the part of that pathname that should not change. For example, if we only want to have pathnames within `http://example.com/contacts/`, we can specify a root like:

```js
route.bindings.pushstate.root = "/contacts/"
route("{page}");
route.url({page: "list"}) //-> "/contacts/list"
route.url({foo: "bar"})   //-> "/contacts/?foo=bar"
```

Now, all routes will start with `"/contacts/"`, the default `route.bindings.pushstate.root` value is `"/"`.

### Updating the current route

can-route-pushstate also allows changes to the current route state without creating a new history entry. This behavior can be controlled using the `replaceStateOn`, `replaceStateOff`, and `replaceStateOnce` methods.

Enable the behavior by calling `replaceStateOn` with specified route property keys like:

```js
route.replaceStateOn('page', 'action');
route.attr('page', 'dashboard'); // Route changes, no new history record
```

To return the `attr` call back to normal the `pushstate` behavior, call `replaceStateOff` with the specified route property keys like:

```js
route.replaceStateOff('action');
route.attr('action', 'remove'); // Route changes, new history record is created
```

The behavior can be configured to occur only once for a specific property using `replaceStateOnce` like:

```js
route.replaceStateOnce('page');
route.attr('page', 'dashboard'); // No new history record
route.attr('page', 'search'); // New history record is created
```


## Planning route structure

Complications can arise if your route structure mimics the folder structure inside your app's public directory.  For example, if you have a folder structure like the one in this url for your admin app...

`/admin/users/list.js`

... using a route of /admin/users on the same page that uses the list.js file will require the use of a trailing slash on all routes and links.  The browser already learned that '/admin/users' is folder.  Because folders were originally denoted by a trailing slash in a url, the browser will correct the url to be '/admin/users/'.  While it is possible to add the trailing slash in routes and listen for them, any link to the page that omits the trailing slash will not trigger the route handler.
