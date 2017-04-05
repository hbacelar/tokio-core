'use strict';

const test = require('tape');

test('Fails with timeout', function (t) {
    const tokio = require('../../');
    const programFactory = require('../helpers/programs').slowProgramFactory;
    const container = new tokio.Container(programFactory);

    t.plan(1);

    container.init(0)
        .then(t.fail.bind(t, 'Should have failed with a timeout error'))
        .catch((err) => {
            t.equal(err.message, 'The context failed to boot in a timely fashion. Check your plugins and box connectivity');
        });
});

test('Returns no arguments', function (t) {
    const tokio = require('../../');
    const programFactory = require('../helpers/programs').programFactory;
    const container = new tokio.Container(programFactory);

    t.plan(1);

    container.init()
        .then(function(arg) {
            t.equal(arg, undefined, 'Should have returned no arguments');
        })
        .catch(t.fail);
});

test('Holds a reference to the program', function (t) {
    const tokio = require('../../');
    const programFactory = require('../helpers/programs').programFactory;
    const program = programFactory();
    const container = new tokio.Container(programFactory);

    t.plan(1);

    container.init()
        .then(function() {
            t.deepEqual(container.program.impl, program, 'The program should be a reference pointer');
        })
        .catch(t.fail);
});

test('By default has some plugins', function (t) {
    const tokio = require('../../');
    const programFactory = require('../helpers/programs').programFactory;
    const container = new tokio.Container(programFactory);

    t.plan(1);

    container.init()
        .then(function() {
            t.fail();
        })
        .catch(t.fail);
});