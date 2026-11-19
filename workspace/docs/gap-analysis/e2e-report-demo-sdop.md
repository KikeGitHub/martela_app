# Reporte de Validación E2E (Oráculo Playwright) — Demo MARTELA 6 Módulos SDOP

- **Fecha de Ejecución**: 2026-11-19T19:17:48.332Z
- **Motor**: Playwright Chromium Headless
- **Estado Global**: **PASS (11 / 11 validaciones exitosas)**
- **Errores en Consola (`page.on('console')`)**: 0
- **Excepciones No Capturadas (`page.on('pageerror')`)**: 0

## Matriz de Pruebas Ejecutadas

| # | Caso de Prueba Validado | Estado | Evidencia Técnica |
| :--- | :--- | :---: | :--- |
| 1 | 1. Pantalla de Login y 5 Roles Operativos del Análisis | **PASS** | Roles detectados (5): Carlos Mendoza — Dirección / Administrador General (6 Módulos) | David Morales — Recepción, Video-Evidencia y Calidad (Mód. 1, 2, 3, 5) | Elisa Ramírez — Báscula Digital, Gavetas y Despiece B2B (Mód. 1, 3, 5) | Adriana López — Motor Financiero Fix y Auditoría PLD (Mód. 1, 4, 5, 6) | Miguel Torres — Chofer Custodio PWA Móvil (Mód. 6) |
| 2 | 2. Menú Lateral Depurado (Exactamente 6 Módulos Core, Cero Opciones Extra) | **PASS** | Opciones en menú (6): 1. Catálogo & Circonias Fichas técnicas y matriz CZ, 2. Recepción & Calidad Valijas aduanales y video, 3. Báscula & Bóveda Pesaje analítico por gaveta, 4. Cotización FIX & Costos Tarifa máxima y liquidación, 5. Despiece B2B (Coppel & MLS) Portal Coppel & Montepío Luz Saviñón, 6. Custodia & Entrega PLD Firma digital y geo-evidencia |
| 3 | 3. Módulo 1: Catálogo Maestro Multi-Proveedor, Matriz CZ y Modal CRUD Compacto y Ergonómico | **PASS** | Búsqueda predictiva (1 resultado), Modal CRUD compacto y sin widgets innecesarios abierto y cerrado con éxito tras calibrar CZ a 0.1800g con feedback loading |
| 4 | 4. Módulo 2: Recepción FedEx/Cometra, Video-Evidencia y Semáforo de Calidad (+1 Aprobado/Reparación/Merma) | **PASS** | Guía FDX-7894512039-HK, visor de video-evidencia y botones +1 del Semáforo de Calidad verificados |
| 5 | 5. Módulo 3: Báscula Digital (0.0000g), Descuento CZ, Cálculo Oro Fino (5 dec) y Etiqueta Térmica | **PASS** | Bruto 2.3800g - CZ 0.1800g = Neto 2.2000 g (0.91667 g Au Fino) -> Etiqueta Térmica generada para PZ-2026-0501 |
| 6 | 6. Módulo 4: Motor Financiero Fix (Hoy vs. Ayer), Liquidación Bipartita y Cuenta Maquila 24K | **PASS** | Aplicada Tarifa Máxima Fix ($2680.00 USD), Renglón 1 M.O., Renglón 2 Metal, Margen 70% + IVA 16% y Oro Fino 24K |
| 7 | 7. Módulo 5: Despiece B2B (438 sub-piezas), Sello Z008340 y Layout Excel de 16 Columnas Exactas | **PASS** | Conciliación 100% (438/438 pzs) | Columnas generadas (16): #, Centro Logístico, Modelo Martela, Código de Barras SKU, Descripción, Kilataje, Cantidad, Peso Bruto, Peso Neto Oro, Costo M.O., Costo Metal, Total Martela, Margen MLS (70%), Costo Público con IVA, Oro Fino Puro, Factura SAE |
| 8 | 8. Módulo 6: Logística PWA, Validación de Sello Z008341, Firma Canvas y Expediente Digital PLD | **PASS** | Sello plástico Z008341 validado, firma en Canvas encriptada en Base64 y expediente PLD-EXP-2026-3050 sellado |
| 9 | 9. Control de Acceso por Roles (RBAC en Menú Lateral) | **PASS** | Admin: 6 | David (Recepción): 4 | Elisa (Bóveda): 3 | Adriana (Finanzas/PLD): 4 | Miguel (Chofer PWA): 1 |
| 10 | 10. Fachada de Tablas BD Simuladas (db-tables-facade.js) y Exportador SQL PostgreSQL | **PASS** | 17 tablas PostgreSQL aisladas (proveedores, productos_sku, proveedor_modelo_equivalencia, recepciones_paqueteria, inspecciones_calidad, ubicaciones_gavetas, piezas_inventario_individual, tasas_metal_fix, saldos_maquila_oro_fino, clientes_centros_logisticos, salidas_remisiones, salida_piezas_detalle, pld_evidencias_entrega, ordenes_compra, orden_compra_lineas, compras_logistica_importacion, proveedor_estado_cuenta) | Script SQL generado (1248722 bytes) |
| 11 | 11. Monitoreo de Consola y Excepciones JS (Oráculo Playwright) | **PASS** | Console errors (0):  | Page errors (0):  |
