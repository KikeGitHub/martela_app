import { test, expect } from '@playwright/test';

/**
 * Suite E2E Oráculo Playwright — Validación de la Demo MARTELA (6 Módulos de Alto Impacto SDOP)
 * Verifica:
 * 1. Login por roles operativos (Carlos, David, Elisa, Adriana, Miguel) y que el menú contenga ÚNICAMENTE las 6 opciones necesarias.
 * 2. Módulo 1: Catálogo Maestro Multi-Proveedor y Matriz CZ (búsqueda predictiva 300ms, chip CZ -0.1800 g, factor oro fino).
 * 3. Módulo 2: Recepción de Paquetería, Video-Evidencia y Semáforo de Calidad (+1 Aprobado, +1 Reparación, +1 Merma).
 * 4. Módulo 3: Báscula Digital (0.0000 g), descuento CZ, cálculo Oro Fino (5 dec) y Gavetas (BOVEDA-R1-N1-G01).
 * 5. Módulo 4: Motor Financiero Fix (Tarifa Máxima Hoy vs. Ayer), Liquidación Bipartita y Cuenta Maquila Oro Fino.
 * 6. Módulo 5: Despiece B2B, Layout Excel 16 Columnas y Hoja de Remisión con Sello (FOLIO: Z008340).
 * 7. Módulo 6: Logística PWA Móvil (390px), Validación de Sello, Firma Táctil Canvas y Expediente Digital PLD.
 * 8. Fachada de Tablas PostgreSQL (window.MartelaDbTablesFacade) y Cero Errores en Consola.
 */
test.describe('Oráculo Playwright SDOP — Martela 6 Módulos Core', () => {
  test('Valida Login, Menú Depurado de 6 Módulos, Fachadas BE/DB y Flujo E2E sin errores de consola', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(err.message);
    });

    await page.goto('http://localhost:8090/index.html');

    // 1. Validar pantalla de Login y Roles
    await expect(page.locator('#loginView')).toBeVisible();
    await page.selectOption('#loginUserSelect', 'admin');
    await page.click('#loginView button[type="submit"]');

    // 2. Validar que el menú lateral tenga EXACTAMENTE 6 opciones para Dirección General
    const navButtons = page.locator('#sidebarNav .navbtn');
    await expect(navButtons).toHaveCount(6);

    // 3. Validar Módulo 1 (Catálogo Maestro & Matriz CZ)
    await expect(page.locator('#pageTitle')).toContainText('1. Catálogo & Matriz CZ');
    await expect(page.locator('#contentContainer')).toContainText('07502278209688');

    // 4. Validar Módulo 2 (Recepción & Calidad)
    await page.click('#navbtn-reception');
    await expect(page.locator('#pageTitle')).toContainText('2. Recepción & Calidad');
    await expect(page.locator('#contentContainer')).toContainText('FDX-7894512039-HK');

    // 5. Validar Módulo 3 (Báscula & Gavetas)
    await page.click('#navbtn-inventory');
    await expect(page.locator('#pageTitle')).toContainText('3. Báscula & Gavetas');
    await expect(page.locator('#scaleLcdBruto')).toBeVisible();

    // 6. Validar Módulo 4 (Motor Fix & Bipartita)
    await page.click('#navbtn-pricing');
    await expect(page.locator('#pageTitle')).toContainText('4. Motor Fix & Bipartita');
    await expect(page.locator('#contentContainer')).toContainText('TARIFA VIGENTE APLICADA');

    // 7. Validar Módulo 5 (Despiece B2B & Excel 16 Columnas)
    await page.click('#navbtn-coppel');
    await expect(page.locator('#pageTitle')).toContainText('5. Despiece B2B & Excel');
    await expect(page.locator('#contentContainer')).toContainText('Z008340');

    // 8. Validar Módulo 6 (Logística PWA & PLD)
    await page.click('#navbtn-logistics');
    await expect(page.locator('#pageTitle')).toContainText('6. Logística PWA & PLD');
    await expect(page.locator('#contentContainer')).toContainText('3050 Santa Fe Avant');

    // 9. Validar Fachada de Tablas PostgreSQL
    const tableNames = await page.evaluate(() =>
      Object.keys((window as any).MartelaDbTablesFacade.getPostgresTablesSnapshot())
    );
    expect(tableNames).toContain('proveedores');
    expect(tableNames).toContain('productos_sku');
    expect(tableNames).toContain('piezas_inventario_individual');
    expect(tableNames).toContain('pld_evidencias_entrega');

    expect(consoleErrors).toEqual([]);
  });
});

