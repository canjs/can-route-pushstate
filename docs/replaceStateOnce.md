@function can-route-pushstate.prototype.replaceStateOnce replaceStateOnce
@parent can-route-pushstate.prototype

@description Allows one change to the current route state without creating new history entries.

@signature `push.replaceStateOnce( key )`

  `replaceStateOnce` changes the behavior of [can-route-pushstate] from using [pushState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_pushState()_method) to [replaceState](https://developer.mozilla.org/en-US/docs/Web/API/History_API#The_replaceState()_method) for the _next_ route change. This allows for one change to the specified routes without creating new history entries.

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
  @highlight 21

  @param {String} key A [can-route.data] property key.