# Suite E2E Oráculo Playwright (`/frontend/e2e/`)

En esta carpeta se ubican las especificaciones de pruebas E2E y regresión visual de la **Fase 4** (`[NOMBRE_MODULO].spec.ts`), las cuales validan:
- Flujos de negocio (alta de piezas, pesaje en báscula con 3 decimales `0.000g`, balance de oro, filtros y modales).
- Cero errores en consola (`page.on('console')`, `page.on('pageerror')`) y cero respuestas HTTP 500.
- Fidelidad visual frente a `/demo` mediante `toHaveScreenshot({ maxDiffPixelRatio: 0.01 })`.

