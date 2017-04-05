'use strict';

const METHOD_PRECONDITIONS = '$require';
const METHOD_MAIN = '$do';
const METHOD_POSTCONDITIONS = '$ensure';

const annotate = require('@avejidah/get-parameter-names');

function Operation(op) {
    this._operation = op;

    if (this.hasPreconditions()) {
        this.preconditions().$inject = annotate(this.preconditions());
    }

    if (this.hasPostconditions()) {
        this.postconditions().$inject = annotate(this.postconditions());
    }

    this.main().$inject = annotate(this.main());
}

Operation.prototype.hasPreconditions = function hasPreconditions() {
    return !!this._operation[METHOD_PRECONDITIONS];
};

Operation.prototype.preconditions = function preconditions() {
    return this._operation[METHOD_PRECONDITIONS];
};

Operation.prototype.main = function main() {
    return this._operation[METHOD_MAIN];
};

Operation.prototype.hasPostconditions = function hasPostconditions() {
    return !!this._operation[METHOD_POSTCONDITIONS];
};

Operation.prototype.postconditions = function postconditions() {
    return this._operation[METHOD_POSTCONDITIONS];
};

Operation.prototype.toString = function toString() {
    return `Operation`;
};

module.exports = Operation;