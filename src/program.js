'use strict';

const METHOD_CONFIGURE = '$configure';
const METHOD_SETUP = '$setup';
const METHOD_TEARDOWN = '$teardown';
const METHOD_OPERATIONS = '$operations';

const patrun = require('patrun');
const jsonic = require('jsonic');
const entries = require('./utils').entries;
const Operation = require('./operation');

function _noop() {}

function Module(impl) {
    this._patrun = patrun();
    // TODO validate operations
    this._module = impl;

    for (let [key, handler] of entries(this.getOperations())) {
        let pattern = jsonic(key);
        console.log('Registering [ pattern=', pattern, ']');
        this._patrun.add(pattern, new Operation(handler));
    }
}

Module.prototype.getOperations = function getOperations() {
    return this._module[METHOD_OPERATIONS];
};

Module.prototype.match = function match(pattern) {
    return this._patrun.find(pattern);
};

Module.prototype.configure = function configure() {
    return this._module[METHOD_CONFIGURE] || _noop();
};

Module.prototype.setup = function setup() {
    return this._module[METHOD_SETUP] || _noop();
};

Module.prototype.teardown = function teardown() {
    return this._module[METHOD_TEARDOWN] || _noop();
};

Module.prototype.toString = function toString() {
    return `Module [#programs=${Object.keys(this.getOperations()).length}]`;
};

module.exports = Module;