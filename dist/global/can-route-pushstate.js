/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		modules[moduleName] = module && module.exports ? module.exports : result;
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*can-route-pushstate@3.0.0-pre.2#can-route-pushstate*/
define('can-route-pushstate', function (require, exports, module) {
    'use strict';
    var isNode = require('can-util/js/is-node/is-node');
    var extend = require('can-util/js/assign/assign');
    var each = require('can-util/js/each/each');
    var makeArray = require('can-util/js/make-array/make-array');
    var diffObject = require('can-util/js/diff-object/diff-object');
    var canEvent = require('can-event');
    var route = require('can-route');
    var hasPushstate = window.history && window.history.pushState;
    var isFileProtocol = window.location && window.location.protocol === 'file:';
    if (!isFileProtocol && hasPushstate) {
        route.bindings.pushstate = {
            root: '/',
            matchSlashes: false,
            paramsMatcher: /^\?(?:[^=]+=[^&]*&)*[^=]+=[^&]*/,
            querySeparator: '?',
            bind: function () {
                if (isNode()) {
                    return;
                }
                canEvent.on.call(document.documentElement, 'click', 'a', anchorClickHandler);
                each(methodsToOverwrite, function (method) {
                    originalMethods[method] = window.history[method];
                    window.history[method] = function (state, title, url) {
                        var absolute = url.indexOf('http') === 0;
                        var searchHash = window.location.search + window.location.hash;
                        if (!absolute && url !== window.location.pathname + searchHash || absolute && url !== window.location.href + searchHash) {
                            originalMethods[method].apply(window.history, arguments);
                            route.setState();
                        }
                    };
                });
                canEvent.on.call(window, 'popstate', route.setState);
            },
            unbind: function () {
                canEvent.off.call(document.documentElement, 'click', 'a', anchorClickHandler);
                each(methodsToOverwrite, function (method) {
                    window.history[method] = originalMethods[method];
                });
                canEvent.off.call(window, 'popstate', route.setState);
            },
            matchingPartOfURL: function () {
                var root = cleanRoot(), loc = location.pathname + location.search, index = loc.indexOf(root);
                return loc.substr(index + root.length);
            },
            setURL: function (path, newProps, oldProps) {
                var method = 'pushState';
                var changed;
                if (includeHash && path.indexOf('#') === -1 && window.location.hash) {
                    path += window.location.hash;
                }
                changed = diffObject(oldProps, newProps).map(function (d) {
                    return d.property;
                });
                if (replaceStateAttrs.length > 0) {
                    var toRemove = [];
                    for (var i = 0, l = changed.length; i < l; i++) {
                        if (replaceStateAttrs.indexOf(changed[i]) !== -1) {
                            method = 'replaceState';
                        }
                        if (replaceStateAttrs.once && replaceStateAttrs.once.indexOf(changed[i]) !== -1) {
                            toRemove.push(changed[i]);
                        }
                        console.log(toRemove);
                    }
                    if (toRemove.length > 0) {
                        removeAttrs(replaceStateAttrs, toRemove);
                        removeAttrs(replaceStateAttrs.once, toRemove);
                    }
                }
                window.history[method](null, null, route._call('root') + path);
            }
        };
        var anchorClickHandler = function (e) {
                if (!(e.isDefaultPrevented ? e.isDefaultPrevented() : e.defaultPrevented === true)) {
                    var node = this._node || this;
                    var linksHost = node.host || window.location.host;
                    if (node.href === 'javascript://') {
                        return;
                    }
                    if (window.location.host === linksHost) {
                        var root = cleanRoot();
                        if (node.pathname.indexOf(root) === 0) {
                            var url = (node.pathname + node.search).substr(root.length);
                            var curParams = route.deparam(url);
                            if (curParams.hasOwnProperty('route')) {
                                includeHash = true;
                                window.history.pushState(null, null, node.href);
                                if (e.preventDefault) {
                                    e.preventDefault();
                                }
                            }
                        }
                    }
                }
            }, cleanRoot = function () {
                var domain = location.protocol + '//' + location.host, root = route._call('root'), index = root.indexOf(domain);
                if (index === 0) {
                    return root.substr(domain.length);
                }
                return root;
            }, removeAttrs = function (arr, attrs) {
                var index;
                for (var i = attrs.length - 1; i >= 0; i--) {
                    if ((index = arr.indexOf(attrs[i])) !== -1) {
                        arr.splice(index, 1);
                    }
                }
            }, methodsToOverwrite = [
                'pushState',
                'replaceState'
            ], originalMethods = {}, includeHash = false, replaceStateAttrs = [];
        route.defaultBinding = 'pushstate';
        extend(route, {
            replaceStateOn: function () {
                var attrs = makeArray(arguments);
                Array.prototype.push.apply(replaceStateAttrs, attrs);
            },
            replaceStateOnce: function () {
                var attrs = makeArray(arguments);
                replaceStateAttrs.once = makeArray(replaceStateAttrs.once);
                Array.prototype.push.apply(replaceStateAttrs.once, attrs);
                route.replaceStateOn.apply(this, arguments);
            },
            replaceStateOff: function () {
                var attrs = makeArray(arguments);
                removeAttrs(replaceStateAttrs, attrs);
            }
        });
    }
    module.exports = route;
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();