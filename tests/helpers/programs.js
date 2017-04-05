'use strict';

const Promise = require('bluebird');

const program = {
    $do() {
        return 'Hello World!';
    }
};

const slowProgram = {
    $setup() {
        return new Promise((resolve) => {
           setTimeout(resolve, 1000);
        });
    },

    $do() {
        return 'Hello World!';
    }
};

const programWithPlugins = {
    $configure(addFactory, addValue) {
        addValue('value_name', {
            $setup() {
                // prepare something
            },

            $onEvent() { // called only once
                return 'value';
            },

            $teardown() {
                // close resources, etc...
            }
        });

        addFactory('factory1', {
            $setup() {
                // prepare something
            },

            $onEvent() { // called once per event
                return 'factory-value';
            },

            $teardown() {
                // close resources, etc...
            }
        });
/**
        addPlugin('cenas', 'value');
        addPlugin('cenas1', function () {
            return 'cenas1';
        });
        addPlugin('cenas2', {
            create: {
                // Call factory as a constructor or function
                // factory can be any component that is a function,
                // constructor, or object.
                module: function (a,b,c) {
                    console.log('cenas1', a,b,c);
                    return 'coiso';
                },
                args: [1,2,3]
            }
        });
 */
    },

    $do() {
        return 'Hello World!';
    }
};

module.exports.programFactory = function programFactory() {
    return [program];
};

module.exports.slowProgramFactory = function slowProgramFactory() {
    return [slowProgram];
};

module.exports.programWithPluginsFactory = function programWithPluginsFactory() {
    return programWithPlugins;
};