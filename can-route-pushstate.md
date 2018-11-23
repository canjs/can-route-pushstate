@module {RoutePushstate} can-route-pushstate
@parent can-routing
@collection can-core
@package ./package.json
@group can-route-pushstate.prototype prototype

@description Make [can-route] update the
url's [https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/pathname pathname] with
[https://developer.mozilla.org/en-US/docs/Web/API/History pushState].

@type {RoutePushstate}

  __can-route-pushstate__ exports a `RoutePushstate` constructor function. That constructor function creates observables that are
  two-way bound to the browser's url. When the [can-route.urlData route.urlData] is set to one of those observabes, [can-route]
  will window's [pathname](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.pathname) instead
  of the [hash](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.hash).

  To start using can-route-pushstate set the [can-route.urlData route.urlData] property:

  ```html
  <mock-url pushstate:from="true"></mock-url>
  <script type="module">
  import {route, RoutePushstate} from "can";
  import "//unpkg.com/mock-url@^5.1.1-rc1";

  route.urlData = new RoutePushstate();

  route.register( "{page}" );
  route.register( "contacts/{username}" );

  route.start(); // Initializes can-route

  route.data.username = "JustinMeyer";
  </script>
  ```
  @codepen

@body

## Use

### Creating and changing routes

To create routes use [can-route.register `route.register()`] like:

```html
<mock-url pushstate:from="true"></mock-url>
<script type="module">
import {route, RoutePushstate} from "can";
import "//unpkg.com/mock-url@^5.1.1-rc1";

route.urlData = new RoutePushstate();

route.register( "{page}" );
route.register( "contacts/{username}" );
route.register( "books/{genre}/{author}" );

route.start(); // Initializes can-route

route.data.username = "JustinMeyer";
</script>
```
@codepen
@highlight 8-10

Do not forget to [can-route.start initialize] can-route after creating all routes, do it by calling [can-route.start `route.start()`].

### Listening changes on matched route

As can-route contains a map that represents `window.location.pathname`, you can bind on it.

To bind to specific attributes on [can-route] you can listen to your viewModel's property changes (`viewModel.on()` if using [can-define/map/map]).

### Using different pathname root

`can-route-pushstate` has one additional property, [can-route-pushstate.prototype.root], which specifies the part of that pathname that should not change. For example, if we only want to have pathnames within `http://example.com/contacts/`, we can specify a root like:

```js
import { route, RoutePushstate } from "can";

route.urlData = new RoutePushstate();
route.urlData.root = "/contacts/";
route.register( "{page}" );

const listContacts = route.url( { page: "list" } );
console.log( listContacts ); //-> "/contacts/list"

const params = route.url( { foo: "bar" } );
console.log( params ); //-> "/contacts/?foo=bar"

```
@codepen

Now, all routes will start with `"/contacts/"`. The default [can-route-pushstate.prototype.root] value is `"/"`.

### Updating the current route

[can-route-pushstate] also allows changes to the current route state without creating a new history entry. This behavior can be controlled using the [can-route-pushstate.prototype.replaceStateOn `replaceStateOn`], [can-route-pushstate.prototype.replaceStateOff `replaceStateOff`], and [can-route-pushstate.prototype.replaceStateOnce `replaceStateOnce`] methods.

Enable the behavior by calling `replaceStateOn` with specified route property keys. To return back to normal, call `replaceStateOff` with the specified route property keys.

In this next example clicking the back button in our mock-url shows the path as _search_ -> _projects_ -> _home_, because [can-route-pushstate.prototype.replaceStateOn] was called when _projects_ was set, instead of creating a new history record the previous one was updated. [can-route-pushstate.prototype.replaceStateOff] was called before setting `route.data.page` to _search_, and a new record was created:

```html
<mock-url pushstate:from="true"></mock-url>
<script type="module">
import { route, RoutePushstate } from "can";
import "//unpkg.com/mock-url@^5.1.1-rc1";

route.urlData = new RoutePushstate();
route.register("{page}");
route.start();

// New history record is created
route.data.set( "page", "home" );

// Dashboard will not show up when you click back
setTimeout(() => {
  // New history record is created
  route.data.set( "page", "dashboard" );
}, 100);

setTimeout(() => {
  // Mutates the previous history record
  route.urlData.replaceStateOn( "page" );
  route.data.set( "page", "projects" );
}, 200)

setTimeout(() => {
  // New history record is created
  route.urlData.replaceStateOff( "page" );
  route.data.set( "page", "search" );
}, 300);
</script>
```
@codepen
@highlight 21,27

The behavior can be configured to occur only once for a specific property using [can-route-pushstate.prototype.replaceStateOnce] like:

```html
<mock-url pushstate:from="true"></mock-url>
<script type="module">
import { route, RoutePushstate } from "can";
import "//unpkg.com/mock-url@^5.1.1-rc1";

route.urlData = new RoutePushstate();
route.register("{page}");
route.start();

// New history record is created
route.data.set( "page", "home" );

// Dashboard will not show up when you click back
setTimeout(() => {
  // New history record is created
  route.data.set( "page", "dashboard" );
}, 100);

setTimeout(() => {
  // Mutates the previous history record
  route.urlData.replaceStateOnce( "page" );
  route.data.set( "page", "search" );
}, 200);
</script>
```
@codepen
@hightlight 21


## Planning route structure

Complications can arise if your route structure mimics the folder structure inside your app's public directory.  For example, if you have a folder structure like the one in this url for your admin app...

`/admin/users/list.js`

... using a route of /admin/users on the same page that uses the list.js file will require the use of a trailing slash on all routes and links.  The browser already learned that '/admin/users' is folder.  Because folders were originally denoted by a trailing slash in a url, the browser will correct the url to be '/admin/users/'.  While it is possible to add the trailing slash in routes and listen for them, any link to the page that omits the trailing slash will not trigger the route handler.
