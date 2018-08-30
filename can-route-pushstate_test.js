/* jshint asi:true,scripturl:true */
var QUnit = require('steal-qunit');
var RoutePushstate = require('./can-route-pushstate');
var route = require('can-route');
require("./can-route-pushstate-iframe-test");

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



}
