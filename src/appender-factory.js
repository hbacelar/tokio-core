'use strict';

const PATTERN_DEFAULT = "%[%r %p %c -%] %m";

function LoggerAppenderFactory() {
}

LoggerAppenderFactory.prototype.createConsoleAppender(level, pattern = PATTERN_DEFAULT) {
    return {
        type: 'console',
        category: '[default]',
        "layout": {
            "type": "pattern",
            "pattern": pattern
        }
    };
}

LoggerAppenderFactory.prototype.createFileAppender(level, path) {
}

module.exports = new LoggerAppenderFactory();
