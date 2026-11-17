# SDD — Módulo 1: Catálogo Maestro Multi-Proveedor y Matriz de Circonias (CZ)

- **ID Documento**: SDD-MOD-001
- **Módulo**: Catálogo Maestro, Equivalencias Internacionales y Descuento Paramétrico de Pedrería
- **Versión**: 2.0 (Arquitectura Modal-First CRUD y Reducción Cognitiva)
- **Estado**: Aprobado para Fase 3
- **ADR Relacionado**: [ADR-0001](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md), [ADR-0002](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 1. Plan de Reutilización (Audit-First)
- **Entidades Existentes**: Extiende `Producto.java` y `Proveedor.java`. No duplica tablas maestras.
- **Puertos Frontend**: Implementa `src/app/modules/catalog/ports/catalog.repository.ts`.
- **Adaptadores**: `CatalogLocalStorageAdapter` (Fase 0) y `CatalogHttpAdapter` (Fase 3).
- **Controlador Spring Boot**: `com.martela.catalog.infrastructure.rest.ProductoController`.

---

## 2. Migración SQL DDL (Flyway / PostgreSQL)
Tablas base en `V2__martela_6_modulos_core.sql`:

```sql
-- 1. Tabla de Proveedores Internacionales y Talleres
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    pais_origen VARCHAR(50) NOT NULL CHECK (pais_origen IN ('CHINA', 'HONG_KONG', 'ITALIA', 'TURQUIA', 'MEXICO')),
    moneda_compra VARCHAR(5) NOT NULL DEFAULT 'USD',
    lead_time_dias INT DEFAULT 60,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Catálogo Maestro de Productos y Matriz CZ
CREATE TABLE IF NOT EXISTS productos_sku (
    sku VARCHAR(30) PRIMARY KEY,
    sku_14 VARCHAR(14) UNIQUE NOT NULL,
    modelo_martela VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    tipo_alhaja VARCHAR(50) NOT NULL,
    metal_tipo VARCHAR(20) NOT NULL CHECK (metal_tipo IN ('ORO_10K', 'ORO_14K', 'ORO_18K', 'PLATA_925')),
    medida VARCHAR(50) DEFAULT 'Estándar',
    costo_mo_base NUMERIC(10,2) NOT NULL DEFAULT 180.00,
    peso_piedra_cz NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    factor_oro_fino NUMERIC(8,5) GENERATED ALWAYS AS (
        CASE 
            WHEN metal_tipo = 'ORO_14K' THEN 0.58333
            WHEN metal_tipo = 'ORO_10K' THEN 0.41667
            WHEN metal_tipo = 'ORO_18K' THEN 0.75000
            ELSE 0.00000
        END
    ) STORED,
    activo BOOLEAN DEFAULT TRUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de Equivalencias Multi-Proveedor
CREATE TABLE IF NOT EXISTS proveedor_modelo_equivalencia (
    id SERIAL PRIMARY KEY,
    id_proveedor INT REFERENCES proveedores(id),
    sku_martela VARCHAR(30) REFERENCES productos_sku(sku),
    modelo_proveedor VARCHAR(80) UNIQUE NOT NULL,
    descripcion_proveedor TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_productos_sku_14 ON productos_sku(sku_14);
CREATE INDEX IF NOT EXISTS idx_productos_modelo_martela ON productos_sku(modelo_martela);
```

---

## 3. Contratos REST y DTOs (Spring Boot)

### GET `/api/v1/productos/buscar`
- **Query Params**: `query` (String), `metal_tipo` (String, opcional), `id_proveedor` (Integer, opcional).
- **Comportamiento**: Busca indistintamente por Modelo Proveedor, Modelo Martela o SKU GTIN-14.
- **Respuesta**: `List<ProductoCatalogoDTO>` con precisión a 4 decimales en `peso_piedra_cz`.

### POST `/api/v1/productos`
- **Request Body** (`GuardarProductoRequest`):
```json
{
  "sku_14": "07502278209888",
  "modelo_martela": "MRT-AN-8050",
  "modelo_proveedor": "FF-2026-CZ9",
  "id_proveedor": 1,
  "descripcion": "Anillo Halo Imperial con Circonias Suizas",
  "metal_tipo": "ORO_14K",
  "tipo_alhaja": "ANILLO",
  "medida": "No. 7.5",
  "costo_mo_base": 245.00,
  "peso_piedra_cz": 0.1800
}
```
- **Validaciones Jakarta**:
  - `@Pattern(regexp = "^[0-9]{14}$")` para `sku_14`.
  - `@NotBlank` en `modelo_martela` y `modelo_proveedor`.
  - `@DecimalMin("0.0000") @DecimalMax("5.0000")` para `peso_piedra_cz`.
  - `@Positive` para `costo_mo_base`.

### POST `/api/v1/productos/importar-catalogo-cz`
- Actualización masiva de matriz CZ con payload JSON o multipart CSV.

---

## 4. Arquitectura Frontend Angular & Patrón Modal-First CRUD

### Principio UX y Ergonomía Operativa
1. **Zero Inline Clutter**: La pantalla principal contiene únicamente KPIs, Buscador Reactivo (debounce 300ms) y Tabla Maestra.
2. **Modal CRUD Compacto y Centrado (`openProductModal`)**:
   - Se abre al presionar `＋ Registrar Nuevo Modelo` o `✏️ Editar`.
   - **Enfoque en Captura Única (max-w-2xl)**: Eliminación de widgets decorativos y tarjetas laterales de previsualización que saturaban el viewport o generaban barras de desplazamiento vertical.
   - **Campos en Fila Doble**: SKU 14 con generador aleatorio `🎲 Generar 14 Dígitos`, Modelo Martela, Proveedor, Código Proveedor, Descripción, Metal/Ley, Tipo de Alhaja y Medida.
   - **Bloque de Descuento CZ**: Input directo con botones de atajo rápido de 1 solo clic (`[0.0000g]`, `[0.1800g]`, `[0.3600g]`, `[0.7200g]`, `[1.1200g]`).
   - **Cero Scroll**: Todo el formulario cabe al 100% en la pantalla de cualquier laptop o terminal de almacén.
3. **Loading State Determinístico**:
   - Al pulsar "Guardar", el botón se deshabilita y conmuta a spinner giratorio (`Guardando en Catálogo...`).
   - Al persistir, el modal se destruye, se emite un Toast verde y la tabla se actualiza sin recarga de página.

---

## 5. Plan de Validación Oráculo en Playwright

| Caso E2E | Criterio de Aceptación |
| :--- | :--- |
| **Búsqueda Predictiva** | Filtrado reactivo en menos de 400ms por código chino `FF-8821-CZ`. |
| **Apertura de Modal** | Invocación de `openProductModal` al hacer clic en fila o botón `Editar`. |
| **Atajo CZ Rápido** | Selección de chip `0.1800g` calibra el campo instantáneamente. |
| **Persistencia & Cierre** | Clic en `#modalSaveProductBtn` muestra loading, cierra modal y genera Toast. |
| **Consola Limpia** | 0 errores en consola JS y 0 excepciones no controladas. |

