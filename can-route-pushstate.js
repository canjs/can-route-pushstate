// # can/route/pushstate/pushstate.js
//
// Plugin for `route` which uses browser `history.pushState` support
// to update window's pathname instead of the `hash`.
//
// It registers itself as binding on `route`, intercepts `click` events
// on `<a>` elements across document and accordingly updates `route` state
// and window's pathname.

/*jshint maxdepth:6, scripturl:true*/
"use strict";

var isNode = require('can-util/js/is-node/is-node');
var extend = require('can-util/js/assign/assign');
var each = require('can-util/js/each/each');
var makeArray = require('can-util/js/make-array/make-array');
var diffObject = require('can-util/js/diff-object/diff-object');
var namespace = require('can-util/namespace');
var LOCATION = require('can-globals/location/location');

var canEvent = require('can-event');
var route = require('can-route');

var hasPushstate = window.history && window.history.pushState;
var loc = LOCATION();
var validProtocols = { 'http:': true, 'https:': true, '': true };
var usePushStateRouting = hasPushstate && loc && validProtocols[loc.protocol];

// Initialize plugin only if browser supports pushstate.
if (usePushStateRouting) {
	// Registers itself within `route.bindings`.
	route.bindings.pushstate = {
		/**
		 * @property {String} can-route-pushstate.root root
		 * @parent can-route-pushstate.static
		 *
		 * @description Configure the base url that will not be modified.
		 *
		 * @option {String} Represents the base url that pushstate will prepend to all
		 * routes.  `root` defaults to: `"/"`.
		 *
		 * @body
		 *
		 * ## Use
		 *
		 * By default, a route like:
		 *
		 *     route(":type/:id")
		 *
		 * Matches urls like:
		 *
		 *     http://domain.com/contact/5
		 *
		 * But sometimes, you only want to match pages within a certain directory.  For
		 * example, an application that is a filemanager.  You might want to
		 * specify root and routes like:
		 *
		 *     route.pushstate.root = "/filemanager/"
		 *     route("file-:fileId");
		 *     route("folder-:fileId")
		 *
		 * Which matches urls like:
		 *
		 *     http://domain.com/filemanager/file-34234
		 *
		 */

		// Start of `location.pathname` is the root.
		// (Can be configured via `route.bindings.pushstate.root`)
		root: "/",
		// don't greedily match slashes in routing rules
		matchSlashes: false,
		paramsMatcher: /^\?(?:[^=]+=[^&]*&)*[^=]+=[^&]*/,
		querySeparator: '?',

		// ## bind

		// Intercepts clicks on `<a>` elements and rewrites original `history` methods.
		bind: function () {
			if(isNode()) {
				return;
			}

			// Intercept routable links.
			canEvent.on.call(document.documentElement, 'click', 'a', anchorClickHandler);

			// Rewrites original `pushState`/`replaceState` methods on `history` and keeps pointer to original methods
			each(methodsToOverwrite, function (method) {
				originalMethods[method] = window.history[method];
				window.history[method] = function (state, title, url) {
					// Avoid doubled history states (with pushState).
					var absolute = url.indexOf("http") === 0;
					var loc = LOCATION();
					var searchHash = loc.search + loc.hash;
					// If url differs from current call original histoy method and update `route` state.
					if ((!absolute && url !== loc.pathname + searchHash) ||
						(absolute && url !== loc.href + searchHash)) {
						originalMethods[method].apply(window.history, arguments);
						route.setState();
					}
				};
			});

			// Bind to `popstate` event, fires on back/forward.
			canEvent.on.call(window, 'popstate', route.setState);
		},

		// ## unbind

		// Unbinds and restores original `history` methods
		unbind: function () {
			canEvent.off.call(document.documentElement, 'click', 'a', anchorClickHandler);

			each(methodsToOverwrite, function (method) {
				window.history[method] = originalMethods[method];
			});

			canEvent.off.call(window, 'popstate', route.setState);
		},

		// ## matchingPartOfURL

		// Returns matching part of url without root.
		matchingPartOfURL: function () {
			var root = cleanRoot(),
			  location = LOCATION(),
				loc = (location.pathname + location.search),
				index = loc.indexOf(root);

			return loc.substr(index + root.length);
		},

		// ## setURL

		// Updates URL by calling `pushState`.
		setURL: function (path, newProps, oldProps) {
			var method = "pushState";
			var changed;
			// Keeps hash if not in path.
			if (includeHash && path.indexOf("#") === -1 && window.location.hash) {
				path += window.location.hash;
			}
			changed = diffObject(oldProps, newProps)
				.map(function (d) {
					return d.property;
				});
			if(replaceStateAttrs.length > 0) {
				var toRemove = [];
				for(var i = 0, l = changed.length; i < l; i++) {
					if(replaceStateAttrs.indexOf(changed[i]) !== -1) {
						method = "replaceState";
					}
					if(replaceStateAttrs.once && (replaceStateAttrs.once.indexOf(changed[i]) !== -1)) {
						toRemove.push(changed[i]);
					}
				}
				if(toRemove.length > 0) {
					removeAttrs(replaceStateAttrs, toRemove);
					removeAttrs(replaceStateAttrs.once, toRemove);
				}
			}
			window.history[method](null, null, route._call("root") + path);
		}
	};

	// ## anchorClickHandler

	// Handler function for `click` events.
	var anchorClickHandler = function (e) {
		if (!(e.isDefaultPrevented ? e.isDefaultPrevented() : e.defaultPrevented === true)) {
			// YUI calls back events triggered with this as a wrapped object.
			var node = this._node || this;
			// Fix for IE showing blank host, but blank host means current host.
			var linksHost = node.host || window.location.host;

			if(node.href === "javascript://") {
				return;
			}

			// If link is within the same domain and descendant of `root`
			if (window.location.host === linksHost) {
				var root = cleanRoot();
				if (node.pathname.indexOf(root) === 0) {

					// Removes root from url.
					var url = (node.pathname + node.search).substr(root.length);
					// If a route matches update the data.
					var curParams = route.deparam(url);
					if (curParams.hasOwnProperty('route')) {
						// Makes it possible to have a link with a hash.
						includeHash = true;
						window.history.pushState(null, null, node.href);

						// Test if you can preventDefault
						// our tests can't call .click() b/c this
						// freezes phantom.
						if (e.preventDefault) {
							e.preventDefault();
						}
					}
				}
			}
		}
	},

		// ## cleanRoot

		// Always returns clean root, without domain.
		cleanRoot = function () {
			var domain = location.protocol + "//" + location.host,
				root = route._call("root"),
				index = root.indexOf(domain);
			if (index === 0) {
				return root.substr(domain.length);
			}
			return root;
		},
		removeAttrs = function(arr, attrs) {
			var index;
			for(var i = attrs.length - 1; i >= 0; i--) {
				if( (index = arr.indexOf(attrs[i])) !== -1) {
					arr.splice(index, 1);
				}
			}
		},
		// Original methods on `history` that will be overwritten
		methodsToOverwrite = ['pushState', 'replaceState'],
		// A place to store pointers to original `history` methods.
		originalMethods = {},
		// Used to tell setURL to include the hash because we clicked on a link.
		includeHash = false,
		// Attributes that will cause replaceState to be called
		replaceStateAttrs = [];

	// Enables plugin, by default `hashchange` binding is used.
	route.defaultBinding = "pushstate";

	extend(route, {
		replaceStateOn: function() {
			var attrs = makeArray(arguments);
			Array.prototype.push.apply(replaceStateAttrs, attrs);
		},
		replaceStateOnce: function() {
			var attrs = makeArray(arguments);
			replaceStateAttrs.once = makeArray(replaceStateAttrs.once);

			Array.prototype.push.apply(replaceStateAttrs.once, attrs);
			route.replaceStateOn.apply(this, arguments);
		},
		replaceStateOff: function() {
			var attrs = makeArray(arguments);
			removeAttrs(replaceStateAttrs, attrs);
		}
	});
}

module.exports = namespace.route = route;
