'use strict';

const METHOD_CONFIGURE = '$configure';
const METHOD_SETUP = '$setup';
const METHOD_PRECONDITION = '$require';
const METHOD_MAIN = '$do';
const METHOD_POSTCONDITION = '$ensure';
const METHOD_TEARDOWN = '$teardown';

function _noop() {};

function Program(factory) {
    // TODO: validate optional methods (they need to be Function)
    // 1. needs to be a function
    // 2. the function must return an Object
    // 3. the Object must have a $do method
    // 4. Optional methods: $onInit, $onDestroy, $require (preconditions), $ensure (postconditions)

    if (!factory instanceof Function) {
        throw new Error('Invalid Program: it needs to be a factory Function');
    }

    const impl = factory();

    if (!impl) {
        throw new Error('Invalid Program: it is incorrectly implemented');
    }

    if (!impl[METHOD_MAIN] && !$impl[METHOD_MAIN] instanceof Function) {
        throw new Error(`Invalid Program: it needs to implement the ${METHOD_MAIN} Function`);
    }

    this.impl = impl;
}

Program.prototype.hasConfigure = function hasConfigure() {
    return this.impl[METHOD_CONFIGURE] instanceof Function;
}

Program.prototype.configure = function configure() {
    return this.impl[METHOD_CONFIGURE] || _noop;
}

Program.prototype.hasSetup = function hasSetup() {
    return this.impl[METHOD_SETUP] instanceof Function;
}

Program.prototype.setup = function setup() {
    return this.impl[METHOD_SETUP] || _noop;
}

Program.prototype.hasTeardown = function hasTeardown() {
    return this.impl[METHOD_TEARDOWN] instanceof Function;
}

Program.prototype.teardown = function teardown() {
    return this.impl[METHOD_TEARDOWN] || _noop;
}

Program.prototype.hasPreconditions = function hasPreconditions() {
    return this.impl[METHOD_PRECONDITION] instanceof Function;
}

Program.prototype.preconditions = function preconditions() {
    return this.impl[METHOD_PRECONDITION] || _noop;
}

Program.prototype.hasPostconditions = function hasPostconditions() {
    return this.impl[METHOD_POSTCONDITION] instanceof Function;
}

Program.prototype.postconditions = function postconditions() {
    return this.impl[METHOD_POSTCONDITION] || _noop;
}

Program.prototype.main = function main() {
    return this.impl[METHOD_MAIN];
}

Program.prototype.toString = function toString() {
    return `Program [name=${this.impl.name}]`;
}

module.exports = Program;