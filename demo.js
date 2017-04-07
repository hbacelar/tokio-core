'use strict';

const sum = {
    $require($params, $log) {
        //$log.trace('sum preconditions', $params);
    },

    $do($params, $log) {
        //$log.trace('Executing sum');
        return Number($params.a) + Number($params.b);
    },

    $ensure($outcome, $log) {
        //$log.trace('sum postconditions', $outcome);
    }
};

const mult = {
    $require($params, $log) {
        $log.trace('mult preconditions', $params);
    },

    $do($params, $log) {
        $log.trace('Executing mult');
        return Number($params.a) * Number($params.b);
    },

    $ensure($outcome, $log) {
        $log.trace('mult postconditions', $outcome);
    }
};

const program = {
    $configure(addFactory, addValue) {
        addValue('mysql', 'mysql-client');
        addValue('mysql2', 'mysql-client');

        addFactory('factory1', function (mysql) {
            return function factory1() { // called once per event, injectable
                return 'factory-value :: ' + mysql;
            }
        });
    },

    $setup($log) {
        $log.info('Program setup');
    },

    $operations: {
        'role:math,cmd:sum': sum,
        'role:math,cmd:mult': mult
    },

    $teardown($log) {
        $log.debug('Program teardown');
    }
};

const Fabric = require('./index.js');
const fabric = new Fabric(program);

function recursive(context, i) {
    console.time(i);
    return context.execute({role: 'math', cmd: 'sum', a: 1, b: 2}).then(() => {
        console.timeEnd(i);
        return recursive(context, i++);
    });
}

fabric
    .init()
    .then((context) => {
        context.logger.info('Started!');

        /*const ops = [
            context.execute({role: 'math', cmd: 'sum', a: 1, b: 2}),
            context.execute({role: 'math', cmd: 'mult', a: 3, b: 2})
        ];*/

        return recursive(context, 0);

        /*return Promise.all(ops)
            .then(([sumResult, multResult]) => {
                console.log(`Sum=${sumResult}, Mult=${multResult}`);
            })
            .then(() => {
                return context.execute({a: 3, b: 2}); // no operation to run!!
            })
            .catch((err) => {
                context.logger.error('Runtime error.', err.stack);
            })
            .then(context.destroy.bind(context));*/
    })
    .catch((err) => {
        console.error('Could not start.', err.stack);
    });
