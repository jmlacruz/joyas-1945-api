const fs = require('fs-extra');

// Directorio fuente (donde están tus archivos y carpetas)
const sourceDirectory = './src';
// Directorio de destino (donde se compilarán los archivos TypeScript)
const destinationDirectory = './dist';

// Copia los archivos y carpetas (incluyendo subcarpetas) pero no copia los .ts ni .js
fs.copySync(sourceDirectory, destinationDirectory, {
    filter: (src) => {
        // No copiar archivos TypeScript ni JavaScript (para no sobrescribir los compilados)
        return !src.endsWith('.ts') && !src.endsWith('.js');
    },
    overwrite: false // No sobrescribir archivos existentes
});
