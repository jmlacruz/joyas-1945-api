// Configuración de debug para desarrollo
module.exports = {
  // Variables de entorno para debug
  env: {
    NODE_ENV: 'development',
    DEBUG: '*',
    DEBUG_COLORS: 'true',
    DEBUG_DEPTH: 'null',
    LOG_LEVEL: 'debug',
    VERBOSE_LOGGING: 'true',
    JWT_DEBUG: 'true'
  },
  
  // Configuración de logging mejorado
  logging: {
    level: 'debug',
    colors: true,
    timestamp: true,
    prettyPrint: true,
    // Filtros para diferentes tipos de logs
    filters: {
      jwt: true,
      database: true,
      routes: true,
      errors: true,
      requests: true
    }
  },
  
  // Configuración específica para JWT debugging
  jwt: {
    logExpiration: true,
    logDecoding: true,
    logValidation: true,
    showTokenContent: false // Por seguridad, no mostrar contenido completo
  },
  
  // Breakpoints automáticos para errores comunes
  breakpoints: {
    jwtErrors: true,
    databaseErrors: true,
    validationErrors: true,
    uncaughtExceptions: true
  }
};
