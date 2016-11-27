'use strict';

const wire = require('wire');
const Promise = require('bluebird');
const annotate = require('@avejidah/get-parameter-names');
const Injector = require('di').Injector;
const Module = require('di').Module;
const Program = require('./program');
const log4js = require('log4js');

function Container(nodeModule, config = {}) {
    this.program = new Program(nodeModule);
    this.pluginConfig = {};
    this.context = null;
    this.injector = null;
    log4js.configure(config.log);
    this.rootLogger = log4js.getLogger();
}

Container.prototype.addPlugin = function(name, impl) {
    this.pluginConfig[name] = impl;
};

Container.prototype.init = function (timeout) {

    // Execute the configuration hook
    this.program.configure()(this);

    return wire(this.pluginConfig)
        .timeout(
            Number(timeout),
            new Error('The context failed to boot in a timely fashion. Check your plugins and box connectivity')
        )
        .then((context) => {
            this.context = context;
        })
        .then(() => {
            let modules = new Module();

            for (let pName in this.pluginConfig) {
                if (this.context[pName] instanceof Function) {
                    // Decorate plugin execution Function
                    this.context[pName].$inject = annotate(this.context[pName]);
                    // Add plugin to DI container
                    modules.factory(pName, this.context[pName]);
                } else {
                    modules.value(pName, this.context[pName]);
                }
            };

            this.injector = new Injector([modules]);

            // Decorate all Functions subject to Dependency Injection
            this.program.setup().$inject = annotate(this.program.setup());
            this.program.teardown().$inject = annotate(this.program.teardown());
            this.program.preconditions().$inject = annotate(this.program.preconditions());
            this.program.main().$inject = annotate(this.program.main());
            this.program.postconditions().$inject = annotate(this.program.postconditions());

            // Execute the setup hook
            return this.injector.invoke(this.program.setup(), this.program);
        });
};

Container.prototype.destroy = function destroy() {
    if (!this.context) {
        return;
    }
    // TODO: onDestroy hook
    return this.context.destroy();
}

Container.prototype.logger = function () {
    return this.rootLogger;
};

Container.prototype.execute = function execute(args) {
    return Promise.try(() => {
        const modules = new Module();
        
        /**
         * Create servicing module.
         * This module contains data that *pertains* only to this execution,
         * hence, it is not shared with other executions.
         */
        modules.value('$log', log4js.getLogger('request'));
        
        for(let arg in args) {
            modules.value(arg, args[arg]);
        }

        // if $require then $do then $ensure then END
        // if not $require then END
        // if $require then if not $do then END
        // if $require then $do then if not $ensure then END
        
        const executionVenue = this.injector
            // inherit from boot injector
            .createChild([modules], Object.keys(this.pluginConfig));

        // inject dependencies and execute
        return Promise.try(() => {
            if (this.program.hasPreconditions()) {
                return executionVenue.invoke(this.program.preconditions());
            }
        })
        .then(() => {
            return executionVenue.invoke(this.program.main());
        })
        .then((outcome) => {
            modules.value('$outcome', outcome);

            return Promise.try(() => {
                if (this.program.hasPostconditions()) {
                    return this.injector
                        .createChild([modules], Object.keys(this.pluginConfig))
                        .invoke(this.program.postconditions());
                }
            })
            .then(() => outcome);
        });
    });
}

module.exports = Container;