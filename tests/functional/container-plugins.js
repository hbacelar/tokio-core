'use strict';

const test = require('tape');

test('Resolves plugins', function (t) {
    const tokio = require('../../');
    const programFactory = require('../helpers/programs').programWithPluginsFactory;
    const container = new tokio.Container(programFactory);

    t.plan(1);

    container.init()
        .then(function(arg) {
            t.equal(arg, undefined, 'Should have returned no arguments');
        })
        .catch(t.fail);
});