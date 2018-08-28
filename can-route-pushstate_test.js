/* jshint asi:true,scripturl:true */
var QUnit = require('steal-qunit');
var extend = require('can-assign');
var RoutePushstate = require('./can-route-pushstate');
var route = require('can-route');
var domEvents = require('can-dom-events');

if (window.history && history.pushState) {
	makeTest("can-map");
	makeTest("can-define/map/map");
}

function makeTest(mapModuleName){
	QUnit.module("can/route/pushstate with " + mapModuleName, {
		setup: function () {
			route.urlData = new RoutePushstate();
			window.MAP_MODULE_NAME = mapModuleName;
		}
	});

	test("deparam", function () {
		route.routes = {};
		route("{page}", {
			page: "index"
		});

		var obj = route.deparam("can.Control");
		deepEqual(obj, {
			page: "can.Control"
		});

		obj = route.deparam("");
		deepEqual(obj, {
			page: "index"
		});

		obj = route.deparam("can.Control?where=there");
		deepEqual(obj, {
			page: "can.Control",
			where: "there"
		});

		route.routes = {};
		route("{page}/{index}", {
			page: "index",
			index: "foo"
		});

		obj = route.deparam("can.Control/?where=there");
		deepEqual(obj, {
			page: "can.Control",
			index: "foo",
			where: "there"
		});
	});

	test("deparam of invalid url", function () {
		var obj;

		route.routes = {};
		route("pages/{var1}/{var2}/{var3}", {
			var1: 'default1',
			var2: 'default2',
			var3: 'default3'
		});

		// This path does not match the above route, and since the hash is not
		// a &key=value list there should not be data.
		obj = route.deparam("pages//");
		deepEqual(obj, {});

		// A valid path with invalid parameters should return the path data but
		// ignore the parameters.
		obj = route.deparam("pages/val1/val2/val3?invalid-parameters");
		deepEqual(obj, {
			var1: 'val1',
			var2: 'val2',
			var3: 'val3'
		});
	})

	test("deparam of url with non-generated hash (manual override)", function () {
		var obj;

		route.routes = {};

		// This won't be set like this by route, but it could easily happen via a
		// user manually changing the URL or when porting a prior URL structure.
		obj = route.deparam("?page=foo&bar=baz&where=there");
		deepEqual(obj, {
			page: 'foo',
			bar: 'baz',
			where: 'there'
		});
	})

	test("param", function () {
		route.routes = {};
		route("pages/{page}", {
			page: "index"
		})

		var res = route.param({
			page: "foo"
		});
		equal(res, "pages/foo")

		res = route.param({
			page: "foo",
			index: "bar"
		});
		equal(res, "pages/foo?index=bar")

		route("pages/{page}/{foo}", {
			page: "index",
			foo: "bar"
		})

		res = route.param({
			page: "foo",
			foo: "bar",
			where: "there"
		});
		equal(res, "pages/foo/?where=there")

		// There is no matching route so the hash should be empty.
		res = route.param({});
		equal(res, "")

		route.routes = {};

		res = route.param({
			page: "foo",
			bar: "baz",
			where: "there"
		});
		equal(res, "?page=foo&bar=baz&where=there")

		res = route.param({});
		equal(res, "")
	});

	test("symmetry", function () {
		route.routes = {};

		var obj = {
			page: "=&[]",
			nestedArray: ["a"],
			nested: {
				a: "b"
			}
		}

		var res = route.param(obj)

		var o2 = route.deparam(res)
		deepEqual(o2, obj)
	})

	test("light param", function () {
		route.routes = {};
		route("{page}", {
			page: "index"
		})

		var res = route.param({
			page: "index"
		});
		equal(res, "")

		route("pages/{p1}/{p2}/{p3}", {
			p1: "index",
			p2: "foo",
			p3: "bar"
		})

		res = route.param({
			p1: "index",
			p2: "foo",
			p3: "bar"
		});
		equal(res, "pages///")

		res = route.param({
			p1: "index",
			p2: "baz",
			p3: "bar"
		});
		equal(res, "pages//baz/")
	});

	test('param doesnt add defaults to params', function () {
		route.routes = {};

		route("pages/{p1}", {
			p2: "foo"
		})
		var res = route.param({
			p1: "index",
			p2: "foo"
		});
		equal(res, "pages/index")
	})

	test("param-deparam", function () {

		route("{page}/{type}", {
			page: "index",
			type: "foo"
		})

		var data = {
			page: "can.Control",
			type: "document",
			bar: "baz",
			where: "there"
		};
		var res = route.param(data);
		var obj = route.deparam(res);

		deepEqual(obj, data, "{page}/{type} with query string");
		data = {
			page: "can.Control",
			type: "foo",
			bar: "baz",
			where: "there"
		};
		res = route.param(data);
		obj = route.deparam(res);

		deepEqual(data, obj, "{page}/{type} with query string");

		data = {
			page: " a ",
			type: " / "
		};
		res = route.param(data);
		obj = route.deparam(res);
		delete obj.route;
		deepEqual(obj, data, "slashes and spaces")

		data = {
			page: "index",
			type: "foo",
			bar: "baz",
			where: "there"
		};
		// adding the / should not be necessary.  route.deparam removes / if the root starts with /
		res = "/" + route.param(data);
		obj = route.deparam(res);
		delete obj.route;
		deepEqual(data, obj, "/{page}/{type} starting slash with removed defaults");

		route.routes = {};

		data = {
			page: "foo",
			bar: "baz",
			where: "there"
		};
		res = route.param(data);
		obj = route.deparam(res);
		deepEqual(data, obj)
	})

	test("deparam-param", function () {
		route.routes = {};
		route("{foo}/{bar}", {
			foo: 1,
			bar: 2
		});
		var res = route.param({
			foo: 1,
			bar: 2
		});
		equal(res, "/", "empty slash")

		// you really should deparam with root ..
		var deparamed = route.deparam("//")
		deepEqual(deparamed, {
			foo: 1,
			bar: 2
		})
	})

	test("precedent", function () {
		route.routes = {};
		route("{who}", {
			who: "index"
		});
		route("search/{search}");

		var obj = route.deparam("can.Control");
		deepEqual(obj, {
			who: "can.Control"
		});

		obj = route.deparam("search/can.Control");
		deepEqual(obj, {
			search: "can.Control"
		}, "bad deparam");

		equal(route.param({
			search: "can.Control"
		}),
			"search/can.Control", "bad param");

		equal(route.param({
			who: "can.Control"
		}),
			"can.Control");
	})

	test("better matching precedent", function () {
		route.routes = {};
		route("{type}", {
			who: "index"
		});
		route("{type}/{id}");

		equal(route.param({
			type: "foo",
			id: "bar"
		}),
			"foo/bar");
	})

	test("linkTo", function () {
		route.routes = {};
		route("/{foo}");
		var res = route.link("Hello", {
			foo: "bar",
			baz: 'foo'
		});
		equal(res, '<a href="/bar?baz=foo">Hello</a>');
	})

	test("param with route defined", function () {
		route.routes = {};
		route("holler")
		route("foo");

		var res = route.param({
			foo: "abc"
		}, "foo");

		equal(res, "foo?foo=abc")
	})

	test("route endings", function () {
		route.routes = {};
		route("foo", {
			foo: true
		});
		route("food", {
			food: true
		})

		var res = route.deparam("food")
		ok(res.food, "we get food back")

	});

	test("strange characters", function () {
		route.routes = {};
		route("{type}/{id}");
		var res = route.deparam("foo/" + encodeURIComponent("\/"))
		equal(res.id, "\/")
		res = route.param({
			type: "bar",
			id: "\/"
		});
		equal(res, "bar/" + encodeURIComponent("\/"))
	});

	// Start steal-only
	if (typeof steal !== 'undefined') {

		var makeTestingIframe = function (callback, testHTML) {
			var iframe = document.createElement('iframe');

			window.routeTestReady = function (iCanRoute, loc, history, win) {
				callback({
					route: iCanRoute,
					location: loc,
					history: history,
					window: win,
					iframe: iframe
				}, function () {
					iframe.onload = null;
					iframe.parentNode.removeChild(iframe);
					delete window.routeTestReady;
				});
			};

			testHTML = testHTML || __dirname + "/test/testing.html";
			iframe.src = testHTML + "?" + Math.random();
			document.getElementById("qunit-fixture").appendChild(iframe);
		};

		test("updating the url", function () {
			stop();
			makeTestingIframe(function (info, done) {
				info.route.start()
				info.route("/{type}/{id}");
				info.route.attr({
					type: "bar",
					id: "5"
				});

				setTimeout(function () {
					var after = info.location.pathname;
					equal(after, "/bar/5", "path is " + after);
					start();

					done();

				}, 100);
			});

		});

		test("currentRule should signal when it is read", function(assert) {
			var done = assert.async();

			makeTestingIframe(function(info, cleanup) {
				info.history.pushState(null, null, "/");

				info.route.register("");
				info.route.register("{page}", { foo: "baz" });
				info.route.start()

				info.window.ObservationRecorder.start();
				info.history.pushState(null, null, "home");
				var deps = info.window.ObservationRecorder.stop();

				ok(deps.valueDependencies.has(info.route.urlData));
				cleanup();
				done();
			});
		});

		test("sticky enough routes", function () {
			stop();
			makeTestingIframe(function (info, done) {
				info.route("/active");
				info.route("");
				info.history.pushState(null, null, "/active");

				setTimeout(function () {
					var after = info.location.pathname;
					equal(after, "/active");
					start();

					done();
				}, 30);
			});
		});

		test("unsticky routes", function () {

			stop();
			window.routeTestReady = function (iCanRoute, loc, iframeHistory) {
				// check if we can even test this
				iframeHistory.pushState(null, null, "/bar/" + encodeURIComponent("\/"));
				setTimeout(function timer() {

					if ("/bar/" + encodeURIComponent("\/") === loc.pathname) {
						runTest();

					} else if (loc.pathname.indexOf("/bar/") >= 0) {
						//  encoding doesn't actually work
						ok(true, "can't test!");
						iframe.parentNode.removeChild(iframe);
						start()
					} else {
						setTimeout(timer, 30)
					}
				}, 30);
				var runTest = function () {
					iCanRoute.start();
					iCanRoute("/{type}");
					iCanRoute("/{type}/{id}");
					iCanRoute.attr({
						type: "bar"
					});

					setTimeout(function () {
						var after = loc.pathname;
						equal(after, "/bar", "only type is set");
						iCanRoute.attr({
							type: "bar",
							id: "\/"
						});

						// check for 1 second
						var time = new Date()
						setTimeout(function innerTimer() {
							var after = loc.pathname;

							if (after === "/bar/" + encodeURIComponent("\/")) {
								equal(after, "/bar/" + encodeURIComponent("\/"), "should go to type/id");
								iframe.parentNode.removeChild(iframe);
								start();
							} else if (new Date() - time > 2000) {
								ok(false, "hash is " + after);
								iframe.parentNode.removeChild(iframe);
							} else {
								setTimeout(innerTimer, 30)
							}

						}, 30);

					}, 30);
				};

			};
			var iframe = document.createElement('iframe');
			iframe.src = __dirname + "/test/testing.html?1";
			document.getElementById("qunit-fixture").appendChild(iframe);
		});


		test("clicked hashes work (#259)", function () {

			stop();
			window.routeTestReady = function (iCanRoute, loc, hist, win) {
				//win.queues.log("flush");
				iCanRoute(win.location.pathname, {
					page: "index"
				});

				iCanRoute("{type}/{id}");
				iCanRoute.start();

				window.win = win;
				var link = win.document.createElement("a");
				link.href = "/articles/17#references";
				link.innerHTML = "Click Me"

				win.document.body.appendChild(link);
				domEvents.dispatch(link, "click");

				setTimeout(function () {
					deepEqual(extend({}, iCanRoute.attr()), {
						type: "articles",
						id: "17",
					}, "articles have the right route data");

					equal(iCanRoute.matched(), "{type}/{id}", "articles have the right matched route")

					equal(win.location.hash, "#references", "includes hash");

					start();

					iframe.parentNode.removeChild(iframe);

				}, 100);
			};
			var iframe = document.createElement('iframe');
			iframe.src = __dirname + "/test/testing.html";
			document.getElementById('qunit-fixture').appendChild(iframe);
		});


		test("loading a page with a hash works (#95)", function () {
			// For some reason this test stalled.  Adding checks to hopefully
			// identify the cause if this test fails again.
			var routeTestReadyCalled = false;
			setTimeout(function(){
				if(!routeTestReadyCalled) {
					QUnit.ok(routeTestReadyCalled, "route test ready called");
					QUnit.start();
				}
			},60000);

			stop();
			window.routeTestReady = function (iCanRoute, loc, hist, win) {
				routeTestReadyCalled = true;

				iCanRoute(win.location.pathname, {
					page: "index"
				});

				iCanRoute("{type}/{id}");
				iCanRoute.start();
				QUnit.equal(win.location.hash, "#thisIsMyHash", "hash right after start");

				// For some reason this test stalled.  Adding checks to hopefully
				// identify the cause if this test fails again.
				var timeoutCalled = false;
				setTimeout(function(){
					if(!timeoutCalled) {
						QUnit.ok(timeoutCalled, "timeout called");
						QUnit.start();
					}
				},60000);

				setTimeout(function(){
					timeoutCalled = true;
					QUnit.equal(win.location.hash, "#thisIsMyHash", "hash right after delay");
					QUnit.start();
				},100);

			};
			var iframe = document.createElement('iframe');
			iframe.src = __dirname + "/test/testing.html#thisIsMyHash";
			document.getElementById('qunit-fixture').appendChild(iframe);
		});

		test("preventDefault not called when only the hash changes (can-route-pushstate#75)", function () {

			stop();
			window.routeTestReady = function (iCanRoute, loc, hist, win) {

				iCanRoute(win.location.pathname, {
					page: "index"
				});

				iCanRoute("{type}/{id}");
				iCanRoute.start();

				var link = win.document.createElement("a");
				link.href = "#hash-target";
				link.innerHTML = "Click Me";

				win.document.body.appendChild(link);

				// Detect if can-route-pushstate’s click handler calls preventDefault by overriding it
				var defaultPrevented = false;
				link.addEventListener('click', function(event) {
					event.preventDefault = function() {
						defaultPrevented = true;
					};
				});

				domEvents.dispatch(link, "click");

				notOk(defaultPrevented, "preventDefault was not called");

				equal(win.location.hash, "#hash-target", "includes hash");

				start();

				iframe.parentNode.removeChild(iframe);
			};
			var iframe = document.createElement('iframe');
			iframe.src = __dirname + "/test/testing.html";
			document.getElementById('qunit-fixture').appendChild(iframe);
		});

		test("javascript:// links do not get pushstated", function(){
			stop();
			makeTestingIframe(function (info, done) {
				info.route("{type}", { type: "yay" });
				info.route.start();


				var window = info.window;
				var link = window.document.createElement("a");
				link.href = "javascript://";
				link.innerHTML = "Click Me";

				window.document.body.appendChild(link);
				try {
					domEvents.dispatch(link, "click");
					ok(true, "Clicking javascript:// anchor did not cause a security exception");
				} catch(err) {
					ok(false, "Clicking javascript:// anchor caused a security exception");
				}

				start();
				done();
			});
		});

		test("javascript: void(0) links get pushstated", function(){
			stop();
			makeTestingIframe(function (info, done) {
				info.route(":type", { type: "yay" });
				info.route.start();


				var window = info.window;
				var link = window.document.createElement("a");
				link.href = "javascript: void(0)";
				link.innerHTML = "Click Me";

				window.document.body.appendChild(link);
				try {
					domEvents.dispatch(link, "click");
					ok(true, "Clicking javascript: void(0) anchor did not cause a security exception");
				} catch(err) {
					ok(false, "Clicking javascript: void(0) anchor caused a security exception");
				}

				start();
				done();
			});
		});

		test("links with target=_blank do not get pushstated", function(){
			stop();
			makeTestingIframe(function (info, done) {
				info.route(":type", { type: "yay" });
				info.route.start();


				var window = info.window;
				var link = window.document.createElement("a");
				link.href = "/yay";
				link.target = "_blank";
				link.innerHTML = "Click Me";

				window.document.body.appendChild(link);
				try {
					domEvents.dispatch(link, "click");
					ok(true, "Clicking anchor with blank target did not cause a security exception");
				} catch(err) {
					ok(false, "Clicking anchor with blank target caused a security exception");
				}

				start();
				done();
			});
		});

		test("clicking on links while holding meta key do not get pushstated", function(){
			stop();
			makeTestingIframe(function (info, done) {
				info.route(":type", { type: "yay" });
				info.route.start();


				var window = info.window;
				var link = window.document.createElement("a");
				link.href = "/heyo";
				link.innerHTML = "Click Me";

				window.document.body.appendChild(link);
				try {
					domEvents.dispatch(link, {type: 'click', metaKey: true});
					ok(true, "Clicking anchor with blank target did not cause a security exception");
				} catch(err) {
					ok(false, "Clicking anchor with blank target caused a security exception");
				}

				start();
				done();
			});
		});

		if(window.parent === window) {
			// we can't call back if running in multiple frames
			test("no doubled history states (#656)", function () {
				stop();

				window.routeTestReady = function (iCanRoute, loc, hist, win) {
					var root = loc.pathname.substr(0, loc.pathname.lastIndexOf("/") + 1);
					var stateTest = -1,
						message;

					function nextStateTest() {
						stateTest++;
						win.route.attr("page", "start");

						setTimeout(function () {
							if (stateTest === 0) {
								message = "route.attr";
								win.route.attr("page", "test");
							} else if (stateTest === 1) {
								message = "history.pushState";
								win.history.pushState(null, null, root + "test/");
							} else {
								start();
								iframe.parentNode.removeChild(iframe);
								return;
							}

							setTimeout(function () {
								win.history.back();
								setTimeout(function () {
									var path = win.location.pathname;
									// strip root for deparam
									if (path.indexOf(root) === 0) {
										path = path.substr(root.length);
									}
									equal(win.route.deparam(path)
										.page, "start", message + " passed");
									nextStateTest();
								}, 200);
							}, 200);

						}, 200);
					}

					win.route.urlData.root = root;
					win.route("{page}/");
					win.route.start();
					nextStateTest();
				};

				var iframe = document.createElement("iframe");
				iframe.src = __dirname + "/test/testing.html";
				document.getElementById('qunit-fixture').appendChild(iframe);
			});

			test("URL's don't greedily match", function () {
				stop();
				makeTestingIframe(function(info, done){
					info.route.urlData.root = "testing.html";
					info.route("{module}\\.html");
					info.route.start();

					setTimeout(function(){
						ok(!info.route.attr('module'), 'there is no route match');
						start();

						done();
					}, 100);
				});
			});

		}

		test("routed links must descend from pushstate root (#652)", 2, function () {
			stop();

			var setupRoutesAndRoot = function (iCanRoute, root) {
				iCanRoute("{section}/");
				iCanRoute("{section}/{sub}/");
				iCanRoute.urlData.root = root;
				iCanRoute.start();
			};


			var createLink = function (win, url) {
				var link = win.document.createElement("a");
				link.href = link.innerHTML = url;
				win.document.body.appendChild(link);
				return link;
			};

			// The following makes sure a link that is not "rooted" will
			// behave normally and not call pushState
			makeTestingIframe(function (info, done) {
				setupRoutesAndRoot(info.route, "/app/");
				var link = createLink(info.window, "/route/pushstate/empty.html"); // a link to somewhere outside app

				var clickKiller = function(ev) {
					if(ev.preventDefault) {
						ev.preventDefault();
					}
					return false;
				};
				// kill the click b/c phantom doesn't like it.
				domEvents.addEventListener(info.window.document, "click", clickKiller);

				info.history.pushState = function () {
					ok(false, "pushState should not have been called");
				};

				// click a link and make sure the iframe url changes
				domEvents.dispatch(link, "click");

				done();
				setTimeout(next, 10);
			});

			var next = function () {
				makeTestingIframe(function (info, done) {

					var timer;
					info.route.serializedCompute.bind("change", function () {
						clearTimeout(timer);
						timer = setTimeout(function () {
							// deepEqual doesn't like to compare objects from different contexts
							// so we copy it
							var obj = extend({}, info.route.attr());

							deepEqual(obj, {
								section: "something",
								sub: "test",
							}, "route's data is correct");

							equal(info.route.matched(), "{section}/{sub}/",
								"route's matched property is correct");

							done();
							start();
						}, 10);

					});

					setupRoutesAndRoot(info.route, "/app/");
					var link = createLink(info.window, "/app/something/test/");

					domEvents.dispatch(link, "click");
				});
			};
		});

		test("replaceStateOn makes changes to an attribute use replaceState (#1137)", function() {
			stop();

			makeTestingIframe(function(info, done){
				info.history.pushState = function () {
					ok(false, "pushState should not have been called");
				};

				info.history.replaceState = function () {
					ok(true, "replaceState called");
				};

				info.route.urlData.replaceStateOn("ignoreme");

				info.route.start();
				info.route.attr('ignoreme', 'yes');

				setTimeout(function(){
					start();
					done();
				}, 30);
			});
		});

		test("replaceStateOn makes changes to multiple attributes use replaceState (#1137)", function() {
			stop();

			makeTestingIframe(function(info, done){
				info.history.pushState = function () {
					ok(false, "pushState should not have been called");
				};

				info.history.replaceState = function () {
					ok(true, "replaceState called");
				};

				info.route.urlData.replaceStateOn("ignoreme", "metoo");

				info.route.start();
				info.route.attr('ignoreme', 'yes');

				setTimeout(function(){
					info.route.attr('metoo', 'yes');

					setTimeout(function(){
						start();
						done();
					}, 30);

				}, 30);
			});
		});

		test("replaceStateOnce makes changes to an attribute use replaceState only once (#1137)", function() {
			stop();
			var replaceCalls = 0,
				pushCalls = 0;

			makeTestingIframe(function(info, done){
				info.history.pushState = function () {
					pushCalls++;
				};

				info.history.replaceState = function () {
					replaceCalls++;
				};

				info.route.urlData.replaceStateOnce("ignoreme", "metoo");

				info.route.start();
				info.route.attr('ignoreme', 'yes');

				setTimeout(function(){
					info.route.attr('ignoreme', 'no');

					setTimeout(function() {
						equal(replaceCalls, 1);
						equal(pushCalls, 1);
						start();
						done();
					}, 30);

				}, 30);
			});
		});

		test("replaceStateOff makes changes to an attribute use pushState again (#1137)", function(){
			stop();

			makeTestingIframe(function(info, done){
				info.history.pushState = function () {
					ok(true, "pushState called");
				};

				info.history.replaceState = function () {
					ok(false, "replaceState should not be called called");
				};

				info.route.urlData.replaceStateOn("ignoreme");
				info.route.urlData.replaceStateOff("ignoreme");

				info.route.start();
				info.route.attr('ignoreme', 'yes');

				setTimeout(function(){
					start();
					done();
				}, 30);
			});
		});

	} // end steal-only

	test("empty default is matched even if last", function () {

		route.routes = {};
		route("{who}");
		route("", {
			foo: "bar"
		});

		var obj = route.deparam("");
		deepEqual(obj, {
			foo: "bar"
		});
	});

	test("order matched", function () {
		route.routes = {};
		route("{foo}");
		route("{bar}")

		var obj = route.deparam("abc");
		deepEqual(obj, {
			foo: "abc"
		});
	});

	test("param order matching", function () {
		route.routes = {};
		route("", {
			bar: "foo"
		});
		route("something/{bar}");
		var res = route.param({
			bar: "foo"
		});
		equal(res, "", "picks the shortest, best match");

		// picks the first that matches everything ...
		route.routes = {};

		route("{recipe}", {
			recipe: "recipe1",
			task: "task3"
		});

		route("{recipe}/{task}", {
			recipe: "recipe1",
			task: "task3"
		});

		res = route.param({
			recipe: "recipe1",
			task: "task3"
		});

		equal(res, "", "picks the first match of everything");

		res = route.param({
			recipe: "recipe1",
			task: "task2"
		});
		equal(res, "/task2")
	});

	test("dashes in routes", function () {
		route.routes = {};
		route.register("{foo}-{bar}");

		var obj = route.deparam("abc-def");
		deepEqual(obj, {
			foo: "abc",
			bar: "def"
		});
	});

	test("Binding not added if not using the http/s protocols", function () {
		stop();

		makeTestingIframe(function(info, done){
			equal(info.route.defaultBinding, "hashchange", "using hashchange routing");
			start();
			done();
		}, __dirname + "/test/testing-nw.html");
	});

	test("Binding is added if there is no protocol (can-simple-dom uses an empty string as the protocol)", function() {
		stop();

		makeTestingIframe(function(info, done){
			ok(true, "We got this far which means things did not blow up");
			start();
			done();
		}, __dirname + "/test/testing-ssr.html");
	});

	test("Calling route.stop() works", function(){
		stop();

		makeTestingIframe(function(info, done){
			info.route.start();
			try {
				info.route.stop();
				ok(true, "Able to call stop");
			} catch(err) {
				ok(false, err.message);
			}

			start();
			done();
		});
	});

}
