/*can-route-pushstate@3.0.0-pre.2#can-route-pushstate*/
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