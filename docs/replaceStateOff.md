@function can-route-pushstate.prototype.replaceStateOff replaceStateOff
@parent can-route-pushstate.prototype

@description Restores default [can-route-pushstate] behavior that was changed by [can-route-pushstate.prototype.replaceStateOn].

@signature `push.replaceStateOff( key )`

  `replaceStateOff` restores the default behavior of route parameter keys changed by [can-route-pushstate.prototype.replaceStateOn `replaceStateOn`]. changes to route property keys previously passed to `replaceStateOn` will start creating new history entries.

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
  @highlight 27

  @param {String} key A [can-route.data] property key.