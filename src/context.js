'use strict';

const Promise = require('bluebird');
const Module = require('di').Module;
const log4js = require('log4js');

function Context(injector, modules, program) {
    this._injector = injector;
    this._program = program;
    this._modules = modules;
    this.logger = log4js.getLogger();

    this.start_time = Date.now();
    this.version = require('../package.json').version;
}

Context.prototype.destroy = function destroy() {
    return Promise.try(() => {
        const modules = new Module();

        modules.value('$log', log4js.getLogger()); // TODO: decide which logging facility

        return this._injector
            .createChild([modules], Object.keys(this._modules))
            .invoke(this._program.teardown(), null);
    });
};

Context.prototype.execute = function execute(args) {

    return Promise.try(() => {
            const operation = this._program.match(args);

            if (operation === null) {
                throw new Error(`No operation matches the pattern '${JSON.stringify(args)}'`);
            }

            return operation;
        })
        .then((operation) => {
            const modules = new Module();

            /**
             * Create servicing module.
             * This module contains data that *pertains* only to this execution,
             * hence, it is not shared with other executions.
             */
            modules.value('$log', log4js.getLogger('request'));
            modules.value('$params', args);

            //console.dir(this._program, {depth:null});

            const executionVenue = this._injector
                // inherit from boot _injector
                .createChild([modules], Object.keys(this._modules));

            return Promise.try(() => {
                if (operation.hasPreconditions()) {
                    return executionVenue.invoke(operation.preconditions(), null);
                }
            })
            .then(() => {
                return executionVenue.invoke(operation.main(), null);
            })
            .then((outcome) => {
                return Promise.try(() => {
                    if (operation.hasPostconditions()) {
                        modules.value('$outcome', outcome);

                        return this._injector
                            .createChild([modules], Object.keys(this._modules))
                            .invoke(operation.postconditions(), null);
                    }
                })
                .then(() => outcome);
            });
        });
};

module.exports = Context;
