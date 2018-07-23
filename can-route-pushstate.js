// # can-route-pushstate.js
//
// Plugin for `route` which uses browser `history.pushState` support
// to update window's pathname instead of the `hash`.
//
// It registers itself as binding on `route`, intercepts `click` events
// on `<a>` elements across document and accordingly updates `route` state
// and window's pathname.
/*jshint maxdepth:6, scripturl:true*/
"use strict";
var route = require('can-route');
var bindingProxy = require("can-route/src/binding-proxy");
var canReflect = require("can-reflect");
var KeyTree = require("can-key-tree");

var queues = require("can-queues");
var SimpleObservable = require("can-simple-observable");
var ObservationRecorder = require("can-observation-recorder");

var isNode = require('can-globals/is-node/is-node');
var LOCATION = require('can-globals/location/location');

var domEvents = require('can-dom-events');

var diffObject = require('can-diff/map/map');

// Original methods on `history` that will be overwritten
var methodsToOverwrite = ['pushState', 'replaceState'];

// Always returns clean root, without domain.
var cleanRoot = function() {
	var location = LOCATION();
	var domain = location.protocol + "//" + location.host,
		root = bindingProxy.call("root"),
		index = root.indexOf(domain);
	if (index === 0) {
		return root.substr(domain.length);
	}
	return root;
};

// Handler function for `click` events.
// Checks if a route is matched, if one is, calls `.pushState`

// gets the current url after the root
function getCurrentUrl() {
	var root = cleanRoot(),
		location = LOCATION(),
		loc = (location.pathname + location.search),
		index = loc.indexOf(root);

	return loc.substr(index + root.length);
}


function PushstateObservable() {
	/*
	 * - replaceStateKeys
	 * - replaceStateOnceKeys
	 */
	this.options = {
		replaceStateOnceKeys: [],
		replaceStateKeys: []
	};
	this.dispatchHandlers = this.dispatchHandlers.bind(this);
	var self = this;
	this.anchorClickHandler = function(event) {
		PushstateObservable.prototype.anchorClickHandler.call(self, this, event);
	};
	this.handlers = new KeyTree([Object, Array], {
		onFirst: this.setup.bind(this),
		onEmpty: this.teardown.bind(this)
	});
	this.keepHash = true;
}
PushstateObservable.prototype = Object.create(SimpleObservable.prototype);
PushstateObservable.constructor = PushstateObservable;
canReflect.assign(PushstateObservable.prototype, {
	/**
	 * @property {String} can-route-pushstate.prototype.root root
	 * @parent can-route-pushstate.prototype
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
	 * ```js
	 * route.urlData = new RoutePushstate();
	 * route.register( "{type}/{id}" );
	 * ```
	 *
	 * Matches URLs like:
	 *
	 * ```
	 * http://domain.com/contact/5
	 * ```
	 *
	 * But sometimes, you only want to match pages within a certain directory.  For
	 * example, an application that is a filemanager.  You might want to
	 * specify root and routes like:
	 *
	 * ```js
	 * route.urlData = new RoutePushstate();
	 * route.urlData.root = "/filemanager/";
	 * route.register( "file-{fileId}" );
	 * route.register( "folder-{fileId}" );
	 * ```
	 *
	 * Which matches URLs like:
	 *
	 * ```
	 * http://domain.com/filemanager/file-34234
	 * ```
	 *
	 */

	// Start of `location.pathname` is the root.
	// (Can be configured via `route.urlData.root`)
	root: "/",
	// don't greedily match slashes in routing rules
	matchSlashes: false,
	paramsMatcher: /^\?(?:[^=]+=[^&]*&)*[^=]+=[^&]*/,
	querySeparator: '?',
	dispatchHandlers: function() {
		var old = this.value;
		var queuesArgs = [];
		this.value = getCurrentUrl();
		if (old !== this.value) {
			queuesArgs = [this.handlers.getNode([]), this, [this.value, old]];
			//!steal-remove-start
			if (process.env.NODE_ENV !== 'production') {
				queuesArgs = [
					this.handlers.getNode([]), this, [this.value, old]
					/* jshint laxcomma: true */
					, null, [canReflect.getName(this), "changed to", this.value, "from", old]
					/* jshint laxcomma: false */
				];
			}
			//!steal-remove-end
			queues.enqueueByQueue.apply(queues, queuesArgs);
		}
	},
	anchorClickHandler: function(node, e) {

		if (!(e.isDefaultPrevented ? e.isDefaultPrevented() : e.defaultPrevented === true)) {
			// Fix for IE showing blank host, but blank host means current host.
			var linksHost = node.host || window.location.host;

			// href has some JS in it, let it run
			if (node.href === "javascript://") {
				return;
			}

			// Do not push state if target is for blank window
			if (node.target === '_blank') {
				return;
			}

			// Do not push state if meta key was pressed, mimicking standard browser behavior
			if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) {
				return;
			}

			// If link is within the same domain and descendant of `root`
			if (window.location.host === linksHost) {
				var root = cleanRoot();
				// And the link is within the `root`
				if (node.pathname.indexOf(root) === 0) {

					// Removes root from url.
					var nodePathWithSearch = node.pathname + node.search;
					var url = nodePathWithSearch.substr(root.length);

					// If we've matched a route
					if (route.rule(url) !== undefined) {
						// Makes it possible to have a link with a hash.
						// Calling .pushState will dispatch events, causing
						// `can-route` to update its data, and then try to set back
						// the url without the hash.  We need to retain that.
						if (node.href.indexOf("#") >= 0) {
							this.keepHash = true;
						}

						// We do not want to call preventDefault() if the link is to the
						// same page and just a different hash; see can-route-pushstate#75
						var windowPathWithSearch = window.location.pathname + window.location.search;
						var shouldCallPreventDefault = nodePathWithSearch !== windowPathWithSearch || node.hash === window.location.hash;

						// Now update window.location
						window.history.pushState(null, null, node.href);

						// Test if you can preventDefault
						// our tests can't call .click() b/c this
						// freezes phantom.
						if (shouldCallPreventDefault && e.preventDefault) {
							e.preventDefault();
						}
					}
				}
			}
		}
	},
	setup: function() {
		if (isNode()) {
			return;
		}
		this.value = getCurrentUrl();
		// Intercept routable links.
		domEvents.addDelegateListener(document.documentElement, 'click', 'a', this.anchorClickHandler);
		var originalMethods = this.originalMethods = {};
		var dispatchHandlers = this.dispatchHandlers;
		// Rewrites original `pushState`/`replaceState` methods on `history` and keeps pointer to original methods
		canReflect.eachKey(methodsToOverwrite, function(method) {
			this.originalMethods[method] = window.history[method];
			window.history[method] = function(state, title, url) {
				// Avoid doubled history states (with pushState).
				var absolute = url.indexOf("http") === 0;
				var loc = LOCATION();
				var searchHash = loc.search + loc.hash;
				// If url differs from current call original histoy method and update `route` state.
				if ((!absolute && url !== loc.pathname + searchHash) ||
					(absolute && url !== loc.href + searchHash)) {
					originalMethods[method].apply(window.history, arguments);
					dispatchHandlers();
				}
			};
		}, this);

		// Bind to `popstate` event, fires on back/forward.
		domEvents.addEventListener(window, 'popstate', this.dispatchHandlers);
	},
	teardown: function() {
		domEvents.removeDelegateListener(document.documentElement, 'click', 'a', this.anchorClickHandler);

		canReflect.eachKey(methodsToOverwrite, function(method) {
			window.history[method] = this.originalMethods[method];
		}, this);

		domEvents.removeEventListener(window, 'popstate', this.dispatchHandlers);
	},
	get: function get() {
		ObservationRecorder.add(this);
		return getCurrentUrl();
	},
	set: function(path) {
		var newProps = route.deparam(path);
		var oldProps = route.deparam(getCurrentUrl());
		var method = "pushState";
		var changed;
		// Keeps hash if not in path.
		if (this.keepHash && path.indexOf("#") === -1 && window.location.hash) {
			path += window.location.hash;
		}

		changed = {};
		diffObject(oldProps, newProps)
			.forEach(function(patch) {
				return changed[patch.key] = true;
			});

		// check if we should call replaceState or pushState
		if (this.options.replaceStateKeys.length) {
			this.options.replaceStateKeys.forEach(function(replaceKey) {
				if (changed[replaceKey]) {
					method = "replaceState";
				}
			});
		}
		if (this.options.replaceStateOnceKeys.length) {
			for (var i = this.options.replaceStateOnceKeys.length - 1; i >= 0; i--) {
				var replaceOnceKey = this.options.replaceStateOnceKeys[i];

				if (changed[replaceOnceKey]) {
					method = "replaceState";
					// remove so we don't do this again
					this.options.replaceStateOnceKeys.splice(i, 1);
				}
			}
		}
		window.history[method](null, null, bindingProxy.call("root") + path);
	},


	replaceStateOn: function() {
		canReflect.addValues(this.options.replaceStateKeys, canReflect.toArray(arguments));
	},
	replaceStateOnce: function() {
		canReflect.addValues(this.options.replaceStateOnceKeys, canReflect.toArray(arguments));
	},
	replaceStateOff: function() {
		canReflect.removeValues(this.options.replaceStateKeys, canReflect.toArray(arguments));
		canReflect.removeValues(this.options.replaceStateOnceKeys, canReflect.toArray(arguments));
	}
});

var pushstateObservableProto = {
	"can.getValue": PushstateObservable.prototype.get,
	"can.setValue": PushstateObservable.prototype.set,
	"can.onValue": PushstateObservable.prototype.on,
	"can.offValue": PushstateObservable.prototype.off,
	"can.isMapLike": false,
	"can.valueHasDependencies": function() {
		return true;
	},
};

//!steal-remove-start
if (process.env.NODE_ENV !== 'production') {
	pushstateObservableProto["can.getName"] = function() {
			return "PushstateObservable<" + this.value + ">";
	};
}
//!steal-remove-end


canReflect.assignSymbols(PushstateObservable.prototype, pushstateObservableProto);

module.exports = PushstateObservable;
