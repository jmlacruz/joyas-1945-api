"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    constructor(message, status) {
        super(message);
        this.message = message;
        this.status = status;
        this.status = status;
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=customError.js.map