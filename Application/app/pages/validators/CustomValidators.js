"use strict";
var CustomValidators = (function () {
    function CustomValidators() {
    }
    CustomValidators.checkFirstCharacterValidator = function (control) {
        var valid = /^\d/.test(control.value);
        if (valid) {
            return { checkFirstCharacterValidator: true };
        }
        return null;
    };
    return CustomValidators;
}());
exports.CustomValidators = CustomValidators;
