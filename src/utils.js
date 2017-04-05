'use strict';

/**
 * Iterator on all key,value pairs in an object
 * @param {Object} obj
 * @copyright https://esdiscuss.org/topic/es6-iteration-over-object-values#content-1
 */
module.exports.entries = function* entries(obj) {
    for (let key of Object.keys(obj)) {
        yield [key, obj[key]];
    }
};