"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePriceRange = void 0;
const validatePriceRange = (priceRangeArrOBJ) => {
    return (priceRangeArrOBJ &&
        priceRangeArrOBJ.length === 2 &&
        priceRangeArrOBJ[0] >= 0 &&
        priceRangeArrOBJ[1] > 0 &&
        priceRangeArrOBJ[1] >= priceRangeArrOBJ[0] &&
        !isNaN(priceRangeArrOBJ[0]) && //Verificamos si los valores son numeros sinó isNAN(string) = true
        !isNaN(priceRangeArrOBJ[1]));
};
exports.validatePriceRange = validatePriceRange;
//# sourceMappingURL=index.js.map