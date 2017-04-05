'use strict';

const Promise = require('bluebird');
const annotate = require('@avejidah/get-parameter-names');
const Injector = require('di').Injector;
const Module = require('di').Module;
const log4js = require('log4js');
const uuid = require('uuid/v4');

function Context(injector, modules, program) {
    this._injector = injector;
    this._program = program;
    this._modules = modules;
    //log4js.configure(config.log);
    this.rootLogger = log4js.getLogger();
}

Context.prototype.destroy = function destroy() {
    const modules = new Module();

    modules.value('$log', log4js.getLogger());
    const executionVenue = this._injector
        // inherit from boot _injector
        .createChild([modules], Object.keys(this._modules));

    return Promise.try(() => {
            return executionVenue.invoke(this._program.teardown(), null);
        });
};

Context.prototype.logger = function () {
    return this.rootLogger;
};

Context.prototype.execute = function execute(args) {

    return Promise.try(() => {
            const operation = this._program.match(args);

            if (operation === null) {
                throw new Error('No operation matches the pattern', args);
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
            modules.value('$uuid', uuid());

            //console.dir(this._program, {depth:null});

            // if $require then $do then $ensure then END
            // if not $require then END
            // if $require then if not $do then END
            // if $require then $do then if not $ensure then END

            const executionVenue = this._injector
                // inherit from boot _injector
                .createChild([modules], Object.keys(this._modules));

            // inject dependencies and execute

            //console.dir(executionVenue, {depth:null});
            return Promise.try(() => {
                //console.log('preconditions', operation.hasPreconditions(), operation.preconditions());
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
