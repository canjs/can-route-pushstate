@function can-route-pushstate.prototype.replaceStateOn replaceStateOn
@parent can-route-pushstate.prototype

@description Allows changes to the current route state without creating new history entries.

@signature `push.replaceStateOn( key )`

  `replaceStateOn` changes the behavior of [can-route-pushstate] from using [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method) to [can-route-pushstate.prototype.replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method) for the provided route property `key`s. This allows for changes to the specified routes without creating new history entries.

  In the example clicking the `mock-url` back button will shows the path as _search_ -> _projects_ -> _home_ as setting _projects_ changed the previous history entry instead of creating a new one.

  ```html
  <mock-url pushstate:raw="true"></mock-url>
  <script type="module">
  import { route, RoutePushstate } from "can";
  import "//unpkg.com/mock-url@next";

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
  @highlight 21

  Use [can-route-pushstate.prototype.replaceStateOff] to return the routes to default [can-route-pushstate] behavior.

  @param {String} key A [can-route.data] property key.