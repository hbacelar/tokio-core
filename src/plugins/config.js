'use strict';

const Promise = require('bluebird');
const objectPath = require('object-path');
let store = {};

module.exports = {
    load(path) {
        return Promise.try(() => {
            if (store[path] === undefined) {
                store[path] = objectPath(require(path));
            }

            return {
                has(key) {
                    return store[path].has(key);
                },

                get(key) {
                    return store[path].get(key);
                }
            };
        });
    }
};