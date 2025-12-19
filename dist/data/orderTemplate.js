"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdertemplate = void 0;
const getOrdertemplate = (data) => {
    return `
        <html>
            <head>
                <style>
                    ${data.orderCSS}
                </style>
            </head>
            <body>
                ${data.orderHTML}
            </body>
        </html>
    `;
};
exports.getOrdertemplate = getOrdertemplate;
//# sourceMappingURL=orderTemplate.js.map