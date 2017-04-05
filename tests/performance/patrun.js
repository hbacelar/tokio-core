'use strict';

const test = require('tape');
const process = require('process');

test('patrun +find() performance', function (t) {
    const patrun = require('patrun');
    const pm = patrun()
        .add({a:1}, 'A')
        .add({b:2}, 'B');
    const rounds = 1e6;

    t.plan(4);

    // Warmup
    t.equal('A', pm.find({a: 1, c: 2}));
    t.equal('B', pm.find({b: 2, e: true}));
    t.equal(null, pm.find({c: 1, d: 2}));

    //
    const hrstart = process.hrtime();
    for(let i=1; i<rounds; i++) {
        pm.find({a: 1, c: 2}); // Finds A
        pm.find({b: 2, e: true}); // Finds B
        pm.find({c: 1, d: 2}); // Null
    }
    const hrend = process.hrtime(hrstart);
    const millisTotal = hrend[0]*1e3 + hrend[1]/1000000;
    const findCount = rounds*3 - 3;
    console.info('Execution time (hr): %ds %dms for %d finds. Perf = %d finds per ms', hrend[0], hrend[1]/1000000, rounds*3 - 3, findCount/millisTotal);
    t.ok(findCount/millisTotal > 2000, 'Minimum acceptable performance');
});