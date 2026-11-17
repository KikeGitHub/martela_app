# SDD — Módulo 3: Báscula Digital, Pesaje Individual (Sub-piezas) y Almacén por Gavetas

- **ID Documento**: SDD-MOD-003
- **Módulo**: Hardware Embebido (Báscula RS-232 / USB HID), Sub-piezas Milimétricas y Bóveda Jerárquica
- **Versión**: 2.0 (Fast Weigh Terminal & Thermal Label Modal)
- **Estado**: Aprobado para Fase 3
- **ADR Relacionado**: [ADR-0001](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md), [ADR-0002](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 1. Plan de Reutilización (Audit-First)
- **Entidades Existentes**: Extiende `PiezaInventario.java` y `GavetaUbicacion.java`.
- **Puertos Frontend**: `src/app/modules/inventory/ports/inventory.repository.ts`.
- **Adaptadores**: `InventoryLocalStorageAdapter` y `InventoryHttpAdapter`.
- **Controlador Spring Boot**: `com.martela.inventory.infrastructure.rest.InventarioController`.

---

## 2. Migración SQL DDL (Flyway / PostgreSQL)

```sql
-- 1. Jerarquía de Almacén y Gavetas de Bóveda
CREATE TABLE IF NOT EXISTS ubicaciones_gavetas (
    id_ubicacion SERIAL PRIMARY KEY,
    almacen VARCHAR(50) NOT NULL CHECK (almacen IN ('BOVEDA_ORO', 'RACK_PLATA', 'TAPANCO_FANTASIA', 'DEFECTOS')),
    rack VARCHAR(10) NOT NULL,
    nivel VARCHAR(10) NOT NULL,
    gaveta VARCHAR(10) NOT NULL,
    codigo_completo VARCHAR(50) UNIQUE NOT NULL,
    descripcion VARCHAR(150),
    activo BOOLEAN DEFAULT TRUE
);

-- 2. Piezas Físicas Individuales (Sub-piezas con serial único)
CREATE TABLE IF NOT EXISTS piezas_inventario_individual (
    id_pieza VARCHAR(50) PRIMARY KEY,
    sku_ref VARCHAR(30) NOT NULL REFERENCES productos_sku(sku),
    id_recepcion INT REFERENCES recepciones_paqueteria(id_recepcion),
    id_ubicacion INT REFERENCES ubicaciones_gavetas(id_ubicacion),
    peso_bruto_g NUMERIC(8,4) NOT NULL CHECK (peso_bruto_g > 0),
    peso_piedra_g NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    peso_neto_metal_g NUMERIC(8,4) GENERATED ALWAYS AS (peso_bruto_g - peso_piedra_g) STORED,
    gramos_oro_fino NUMERIC(8,5) NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'DISPONIBLE'
        CHECK (estatus IN ('DISPONIBLE', 'APARTADO_RUTA', 'ENTREGADO', 'FUNDICION')),
    codigo_barras_etiqueta VARCHAR(50),
    pesado_por VARCHAR(80) DEFAULT 'Elisa Ramírez',
    fecha_pesaje TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_piezas_sku_ref ON piezas_inventario_individual(sku_ref);
CREATE INDEX IF NOT EXISTS idx_piezas_estatus ON piezas_inventario_individual(estatus);
```

---

## 3. Contratos REST y DTOs (Spring Boot)

### POST `/api/v1/inventario/pesar-pieza`
- **Request Body** (`PesarPiezaRequest`):
```json
{
  "sku": "MRT-AN-1042",
  "peso_bruto_g": 2.3800,
  "ubicacion_gaveta": "BOVEDA-R1-N2-G05"
}
```
- **Lógica de Negocio Backend**:
  1. Consulta `productos_sku` para obtener `peso_piedra_cz` (ej. `0.1800g`) y `factor_oro_fino` (ej. `0.41667`).
  2. Calcula de forma transaccional:
     $$\text{peso\_neto\_metal\_g} = 2.3800 - 0.1800 = 2.2000\text{g}$$
     $$\text{gramos\_oro\_fino} = 2.2000 \times 0.41667 = 0.91667\text{g}$$
  3. Genera el serial único correlativo (`PZ-2026-0501`) y persiste.
  4. Devuelve la sub-pieza con los datos para la etiqueta térmica.

### GET `/api/v1/inventario/sku/{sku}/existencias`
- Devuelve total de piezas, sumatoria de peso neto y desglose de seriales físicos.

---

## 4. Arquitectura Frontend & Terminal de Pesaje Rápido
- **Display Gigante Digital LCD**: Simula en pantalla la lectura en vivo de la báscula a 4 decimales (`0.0000 g`).
- **Atajo `Enter ↵` Ergonomía de Operario**:
  - El operario coloca la pieza física, digita el peso o presiona `Enter` para grabar y disparar la impresión.
  - El botón exhibe estado loading (`Grabando & Imprimiendo...`) durante 200ms para evitar registros duplicados.
- **Modal de Etiqueta Térmica Zebra/Epson**:
  - Despliega código de barras EAN-128 / GTIN-14, serial único `PZ-2026-XXXX`, desglose tripartito (Bruto, Piedra CZ, Neto) y gaveta física asignada.
- **Historial de Sesión Reactivo**: Grilla en tiempo real con las sub-piezas pesadas en el turno del operario.

