/**
 * Configuración de entorno y Feature Flags SDOP para Martela.
 * Permite conmutar dinámicamente cada uno de los 6 módulos de alto impacto entre:
 * - LocalStorageAdapter (Fase 0 - Prototipo Interactivo / Demo)
 * - HttpAdapter (Fase 3 - Producción con Spring Boot 3.x + PostgreSQL)
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  features: {
    // 6 Módulos de Alto Impacto (Arquitectura Empresarial Martela)
    catalogoMaestroBackend: false,
    recepcionCalidadBackend: false,
    basculaAlmacenBackend: false,
    motorFinancieroFixBackend: false,
    salidasB2bBackend: false,
    logisticaPwaPldBackend: false,
    // Módulos base
    controlOroBackend: false,
    inventarioJoyasBackend: false,
  },
};
