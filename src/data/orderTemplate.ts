export const getOrdertemplate = (data: {orderHTML: string, orderCSS: string}) => {
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