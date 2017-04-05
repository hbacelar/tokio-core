'use strict';

const sum = {
    $require($params, $log, $config) {
        //$log.trace('sum preconditions', $params);
        return $config.load('/home/silvaj/Projects/github.com/jorgemsrs/tokio-core/package.json')
            .then((data) => {
                //$log.debug(data.get('version'));
            });
    },

    $do($params, $uuid, $log) {
        $log.debug('Executing sum', $uuid);
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
        $log.debug('Executing mult');
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

    $setup(mysql, $config, $log) {
        // TODO
        $log.info('Program setup', mysql, $config);
        //return $mysql.start(config.mysql).then(mysql2.start());
    },

    $operations: {
        'role:math,cmd:sum': sum,
        'role:math,cmd:mult': mult
    },

    $teardown(mysql, $log) {
        // TODO
        // return mysql.close();
        $log.debug('Program teardown');
    }
};

const Fabric = require('./index.js');
const fabric = new Fabric(program);

fabric.init().then((context) => {
    context.logger().info('Started!');

    const REPS = 1e3;
    for (let i = 0; i < REPS; i++) {
        context.execute({role: 'math', cmd: 'sum', a: 1, b: 2});
    }

    /*
    return Promise.all(ops)
        .then((result) => {
            console.log(`Sum result is ${result}`);
        })
        .then(context.destroy.bind(context));
*/
    // Execute mult program
    /*context.execute({role: 'math', cmd: 'mult', a: 3, b: 2})
        .then((result) => {
            console.log(`Multiply result is ${result}`);
        })
        .catch((err) => {
            console.error(err.stack);
        });

    // No program found to execute
    context.execute({a: 3, b: 2})
        .catch((err) => {
            console.error(err.stack);
        });
*/
}).catch((err) => {
    console.error('Could not start.', err.stack);
});
