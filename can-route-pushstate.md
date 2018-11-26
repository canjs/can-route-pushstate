@module {RoutePushstate} can-route-pushstate
@parent can-routing
@collection can-core
@package ./package.json
@group can-route-pushstate.prototype prototype

@description Make [can-route] update the
browser's location with
[https://developer.mozilla.org/en-US/docs/Web/API/History pushState].

@type {RoutePushstate}

  __can-route-pushstate__ exports a `RoutePushstate` constructor function. That constructor function creates observables that are
  two-way bound to the browser's url. When the [can-route.urlData route.urlData] is set to one of those observabes, [can-route]
  will update the window's [pathname](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.pathname) and
  [search](https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils/search) instead
  of the [hash](https://developer.mozilla.org/en-US/docs/Web/API/URLUtils.hash).

  To start using `can-route-pushstate` set the [can-route.urlData route.urlData] property
  as follows:

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

The following shows a basic `RoutePushstate` setup within an application
component.  The example:

- Create links using [can-stache-route-helpers.routeUrl] like `/home`, `/dogs`, and `/cats`.
- When users click on those links, [history.pushState()](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
  will update the URL.
- When the url changes, `routeData.page` changes, updating the `<h1>` element.


```html
<mock-url pushstate:from="true"></mock-url>
<my-demo></my-demo>
<script type="module">
import {route, RoutePushstate, Component} from "can";
import "//unpkg.com/mock-url@5";

Component.extend({
	tag: "my-demo",
	view: `
		<h1>{{ this.routeData.page }}</h1>
		<p><a href="{{routeUrl(page='home')}}">home</a></p>
		<p><a href="{{routeUrl(page='dogs')}}">dogs</a></p>
		<p><a href="{{routeUrl(page='cats')}}">cats</a></p>
	`,
	ViewModel: {
		routeData: {
			default(){
				route.urlData = new RoutePushstate();
				route.register( "{page}", {page: "home"} );
				route.start(); // Initializes can-route
				return route.data;
			}
		}
	}
});
</script>
```
@codepen
@highlight 10,11,18

If you haven't already, please read the [guides/routing] guide. It explains
how [can-route] works.  And while the guide show hashchange-based routing,
your app should work the same way regardless if hashchange or pushstate routing is
used.

## Differences between pushState and hashchange based routing

The biggest difference between using `RoutePushstate` and the default [can-route-hash hashchange routing] is
that:

- `RoutePushstate` responds to and updates the _pathname_ and _search_ part of the browser's [location](https://developer.mozilla.org/en-US/docs/Web/API/Location).
- `RouteHash` responds to and updates the _hash_ part of the browser's [location](https://developer.mozilla.org/en-US/docs/Web/API/Location).

For a url like `http://canjs.com/doc/can-route-pushstate.html?view=mobile#Use`:

- _pathname_ is `/canjs/doc/can-route-pushstate.html`
- _search_ is `?view=mobile`
- _hash_ is `#Use`

`RoutePushstate` will only update [can-route.data route.data] with values from the _pathname_ and _search_. The _hash_ part of the
url is ignored but not lost. This is discussed at the bottom of this section.

[can-route.register route.register]-ed rules match the _pathname_. For example, if your app is running on `site.com`,
the following shows what urls are matched:

```js
route.register("")
//  matches http://site.com
//          http://site.com/
//          http://site.com?key=value
//          http://site.com/?key=value

route.register("{page}")
//  matches http://site.com/cats
//          http://site.com/dogs
//          http://site.com/dogs?key=value

route.register("monkeys/{monkeyId}")
//  matches http://site.com/monkeys/5
//          http://site.com/monkeys/5?key=value
```

> Notice that `RoutePushstate` matches registered routing rules against against the entire _pathname_.  This can be changed by setting
> [can-route-pushstate.prototype.root].

The _search_ part of the url is used to add additional values to [can-route.data route.data]. The following example
shows the values in _search_ being added to [can-route.data route.data]:


```js
import {route, RoutePushstate} from "can";

history.pushState({}, "", "/page-value?keyA=valueA&keyB=valueB");

route.urlData = new RoutePushstate();
route.register("{page}");
route.start();

console.log( route.data ) //-> {page: "page-value", keyA: "valueA", keyB: "valueB"}
```
@codepen




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


## Using a different pathname root

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

## Using replaceState instead of pushState

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

## Making reload work

The reload button typically will __not__ work by default in a website that uses `pushState`.  Developers typically
need to:

- Make sure the server respond with HTML for all URLs that a user might navigate to.  For example: `/about` and `tournaments/2018/games/4`.
- The HTML and JavaScript loaded by those pages references all resources correctly.  For example:
  - An image at `/about` might be referenced like `<img src="./static/img/logo.png"/>`.
  - But the same image at `tournaments/2018/games/4` would need to be referenced like `<img src="../../../static/img/logo.png"/>`

One option is to use only absolute paths.  For example:

- An image at `/about` would be referenced like `<img src="/static/img/logo.png"/>`.
- The same image at `tournaments/2018/games/4` would need be referenced like `<img src="/static/img/logo.png"/>`

The problem with this approach is that your app is not as easily transportable.  For example, it couldn't easily be moved from
`http://yourdomain.com` to
`http://yourdomain.com/app/your-app`.

For supporting relative paths, you can use [can-join-uris] and [can-stache.helpers.joinBase].

## Planning route structure

Complications can arise if your route structure mimics the folder structure inside your app's public directory.  For example, if you have a folder structure like the one in this url for your admin app...

`/admin/users/list.js`

... using a route of /admin/users on the same page that uses the list.js file will require the use of a trailing slash on all routes and links.  The browser already learned that '/admin/users' is folder.  Because folders were originally denoted by a trailing slash in a url, the browser will correct the url to be '/admin/users/'.  While it is possible to add the trailing slash in routes and listen for them, any link to the page that omits the trailing slash will not trigger the route handler.

## How it works

On a high-level, `can-route-pushstate` creates an observable type that changes when `history.pushState` is called.  It does this by:

1. Listening to all anchor element (`<a>`) clicks. If the anchor's `.href` matches a [can-route.rule], call `history.pushState`.
1. Overwriting `history.pushState` to dispatch the observable's event handlers.  This signals a change in the  
   observable has happened. (It also overwrites `history.replaceState` and listens to `popstate` events).
