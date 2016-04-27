import QUnit from 'steal-qunit';
import plugin from './can-route-pushstate';

QUnit.module('can-route-pushstate');

QUnit.test('Initialized the plugin', function(){
  QUnit.equal(typeof plugin, 'function');
  QUnit.equal(plugin(), 'This is the can-route-pushstate plugin');
});
