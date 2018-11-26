@property {String} can-route-pushstate.prototype.root root
@parent can-route-pushstate.prototype

@description Configure the base url that will not be modified.

@option {String} Represents the base url that pushstate will prepend to all
routes.  `root` defaults to: `"/"`. The example below shows setting a custom root.

  ```html
  <mock-url pushstate:from="true"></mock-url>
  <script type="module">
  import {route, RoutePushstate} from "can";
  import "//unpkg.com/mock-url@^5.1.1-rc1";

  route.urlData = new RoutePushstate();
  route.urlData.root = "/movies/";
  route.register("{genre}");

  route.start();
  route.data.genre = "comedy";
  </script>
  ```
  @codepen
  @highlight 7

@body

## Use

By default, a route like:

```html
<mock-url pushstate:from="true"></mock-url>
<script type="module">
import {route, RoutePushstate} from "can";
import "//unpkg.com/mock-url@^5.1.1-rc1";

route.urlData = new RoutePushstate();
route.register( "{type}/{id}" );
route.start();

route.data.type = "contact";
route.data.id = "5";
</script>
```
@codepen

Matches URLs like:

```
http://domain.com/contact/5
```

But sometimes, you only want to match pages within a certain directory.  For
example, an application that is a file manager.  You might want to
specify root and routes like:

```html
<mock-url pushstate:from="true"></mock-url>
<script type="module">
import {route, RoutePushstate} from "can";
import "//unpkg.com/mock-url@^5.1.1-rc1";

route.urlData = new RoutePushstate();
route.urlData.root = "/filemanager/";
route.register( "file-{fileId}" );
route.start();
route.data.fileId = 34234;
</script>
```
@codepen

Which matches URLs like:

```
http://domain.com/filemanager/file-34234
```
