'use strict';

const wire = require('wire');
const Promise = require('bluebird');
const annotate = require('@avejidah/get-parameter-names');
const Injector = require('di').Injector;
const Module = require('di').Module;
const Program = require('./program');
const assert = require('assert');
const Context = require('./context');
const utils = require('./utils');
const log4js = require('log4js');
log4js.getLogger();

function Container(moduleImpl, config = {}) {
    this.program = new Program(moduleImpl);
    this._modules = null;
    this._injector = null;
    this._wireSpec = {
        '$$version': require('../package.json').version,
        '$$start': Date.now(),
        '$config': require('./plugins/config')
    };
}

Container.prototype.addFactory = function(name, impl) {
    assert(typeof name === 'string', 'Invalid plugin name');
    assert(impl instanceof Function, 'Invalid plugin implementation');

    this._wireSpec[name] = {
        create: {
            module: impl
        }
    };
    this._wireSpec[name].create.args = annotate(impl).map((arg) => {
        return { $ref: arg };
    });

    return this;
};

Container.prototype.addValue = function(name, impl) {
    assert(typeof name === 'string', 'Invalid plugin name');
    assert(impl, 'Invalid plugin implementation'); // Should be a truthy value

    this._wireSpec[name] = impl;

    return this;
};

Container.prototype.init = function init(timeout = 1000) {

    return Promise.try(() => {
            // Execute the configuration hook
            this.program.configure()(this.addFactory.bind(this), this.addValue.bind(this));
        })
        .then(wire.bind(null, this._wireSpec))
        .then((resolvedWireContext) => {
            this._modules = new Module();

            //console.dir(resolvedWireContext, {depth:null});

            for (let [name, impl] of utils.entries(resolvedWireContext)) {
                if (impl instanceof Function) {
                    // Decorate plugin execution Function
                    impl.$inject = annotate(impl);
                    // Add plugin to DI container
                    this._modules.factory(name, impl);
                } else {
                    this._modules.value(name, impl);
                }
            }
            this._modules.value('$log', log4js.getLogger());

            return this._modules;
        })
        .then((modules) => {
            this._injector = new Injector([modules]);

            // Decorate all Functions subject to Dependency Injection
            this.program.setup().$inject = annotate(this.program.setup());
            this.program.teardown().$inject = annotate(this.program.teardown());

            //modules.forEach((module) => {
            //    console.dir(module, {depth:null});
            //});

            // Execute the setup hook
            return this._injector.invoke(this.program.setup(), null);
        })
        .then(() => { // TODO: improve
            const modules = {};

            this._modules.forEach((mod) => {
               modules[mod[0]] = mod[2];
            });

            return new Context(this._injector, modules, this.program);
        })
        .timeout(
            Number(timeout),
            new Error('The context failed to boot in a timely fashion. Check your plugins and box connectivity')
        );
};

module.exports = Container;