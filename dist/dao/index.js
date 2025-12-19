"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDao = void 0;
const mySQLActions_1 = require("./mySQLActions");
let dao = null;
const getDao = () => {
    if (!dao) {
        dao = new mySQLActions_1.mySQLActions();
        return dao;
    }
    else {
        return dao;
    }
};
exports.getDao = getDao;
//# sourceMappingURL=index.js.map