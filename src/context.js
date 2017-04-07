'use strict';

const Promise = require('bluebird');
const Module = require('di').Module;
const log4js = require('log4js');

function Context(injector, modules, program) {
    this._injector = injector;
    this._program = program;
    this._modules = modules;
    this._moduleNames = Object.keys(this._modules);
    this.logger = log4js.getLogger();

    this.start_time = Date.now();
    this.version = require('../package.json').version;
}

Context.prototype.destroy = function destroy() {
    return Promise.try(() => {
        const modules = new Module();

        modules.value('$log', log4js.getLogger()); // TODO: decide which logging facility

        return this._injector
            .createChild([modules], this._moduleNames)
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
            modules.value('$outcome', undefined);

            //console.dir(this._program, {depth:null});

            // inherit from boot _injector
            const executionVenue = this._injector.createChild([modules], this._moduleNames);

            return Promise.try(function executeRequire() {
                if (operation.hasPreconditions()) {
                    return Promise.try(executionVenue.invoke.bind(executionVenue, operation.preconditions(), null));
                }
            })
            .then(function executeDo() {
                return Promise.try(executionVenue.invoke.bind(executionVenue, operation.main(), null));
            })
            .then(function executeEnsure(result) {
                // Change outcome reference
                executionVenue._providers['$outcome'][1] = result;

                if (operation.hasPostconditions()) {
                    return Promise.try(executionVenue.invoke.bind(executionVenue, operation.postconditions(), null))
                        .then(() => result);
                }

                return result;
            });
        });
};

module.exports = Context;
