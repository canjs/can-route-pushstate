/*can-route-pushstate@3.4.0#can-route-pushstate*/
define([
    'require',
    'exports',
    'module',
    'can-util/js/is-node',
    'can-util/js/assign',
    'can-util/js/each',
    'can-util/js/make-array',
    'can-util/js/diff-object',
    'can-util/namespace',
    'can-globals/location',
    'can-event',
    'can-route'
], function (require, exports, module) {
    (function (global, require, exports, module) {
        'use strict';
        var isNode = require('can-util/js/is-node');
        var extend = require('can-util/js/assign');
        var each = require('can-util/js/each');
        var makeArray = require('can-util/js/make-array');
        var diffObject = require('can-util/js/diff-object');
        var namespace = require('can-util/namespace');
        var LOCATION = require('can-globals/location');
        var canEvent = require('can-event');
        var route = require('can-route');
        var hasPushstate = window.history && window.history.pushState;
        var loc = LOCATION();
        var validProtocols = {
            'http:': true,
            'https:': true,
            '': true
        };
        var usePushStateRouting = hasPushstate && loc && validProtocols[loc.protocol];
        if (usePushStateRouting) {
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
                            var loc = LOCATION();
                            var searchHash = loc.search + loc.hash;
                            if (!absolute && url !== loc.pathname + searchHash || absolute && url !== loc.href + searchHash) {
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
                    var root = cleanRoot(), location = LOCATION(), loc = location.pathname + location.search, index = loc.indexOf(root);
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
                                var nodePathWithSearch = node.pathname + node.search;
                                var url = nodePathWithSearch.substr(root.length);
                                var curParams = route.deparam(url);
                                if (curParams.hasOwnProperty('route')) {
                                    includeHash = true;
                                    var windowPathWithSearch = window.location.pathname + window.location.search;
                                    var shouldCallPreventDefault = nodePathWithSearch !== windowPathWithSearch || node.hash === window.location.hash;
                                    window.history.pushState(null, null, node.href);
                                    if (shouldCallPreventDefault && e.preventDefault) {
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
                ], originalMethods = {}, includeHash = true, replaceStateAttrs = [];
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
        module.exports = namespace.route = route;
    }(function () {
        return this;
    }(), require, exports, module));
});