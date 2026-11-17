# SDD — Módulo 5: Despiece B2B Automatizado, Layouts Excel (16 Columnas) y Hojas de Remisión

- **ID Documento**: SDD-MOD-005
- **Módulo**: Asignación Física B2B por Sucursal / CEDIS, Layout MLS/Coppel y Remisión con Sello
- **Versión**: 2.0 (Mass Breakdown & Official 16-Column Export)
- **Estado**: Aprobado para Fase 3
- **ADR Relacionado**: [ADR-0001](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md), [ADR-0002](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 1. Plan de Reutilización (Audit-First)
- **Entidades Existentes**: Extiende `PedidoB2B.java`, `RemisionEntrega.java`.
- **Puertos Frontend**: `src/app/modules/coppel/ports/coppel.repository.ts`.
- **Adaptadores**: `CoppelLocalStorageAdapter` y `CoppelHttpAdapter`.
- **Controlador Spring Boot**: `com.martela.coppel.infrastructure.rest.DespieceB2BController`.

---

## 2. Migración SQL DDL (Flyway / PostgreSQL)

```sql
-- 1. Centros Logísticos y Sucursales B2B
CREATE TABLE IF NOT EXISTS clientes_centros_logisticos (
    id_centro SERIAL PRIMARY KEY,
    cliente_nombre VARCHAR(80) NOT NULL DEFAULT 'COPPEL_SA_DE_CV',
    tienda_id VARCHAR(30) UNIQUE NOT NULL,
    numero_sucursal VARCHAR(20) NOT NULL,
    nombre VARCHAR(120) NOT NULL,
    ciudad VARCHAR(80) NOT NULL,
    direccion TEXT,
    activo BOOLEAN DEFAULT TRUE
);

-- 2. Salidas / Remisiones de Despiece por Sucursal
CREATE TABLE IF NOT EXISTS salidas_remisiones (
    id_remision SERIAL PRIMARY KEY,
    folio_remision VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    id_centro INT NOT NULL REFERENCES clientes_centros_logisticos(id_centro),
    sello_seguridad_bolsa VARCHAR(50) NOT NULL,
    factura_sae VARCHAR(50) NOT NULL,
    total_piezas INT NOT NULL CHECK (total_piezas > 0),
    peso_bolsa_verificado_g NUMERIC(10,2) NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'LISTO_RUTA' 
        CHECK (estatus IN ('EN_PREPARACION', 'LISTO_RUTA', 'EN_TRANSITO', 'ENTREGADA', 'CON_INCIDENCIA')),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Detalle de Sub-piezas Asignadas a la Remisión
CREATE TABLE IF NOT EXISTS salida_piezas_detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_remision INT NOT NULL REFERENCES salidas_remisiones(id_remision) ON DELETE CASCADE,
    id_pieza VARCHAR(50) NOT NULL REFERENCES piezas_inventario_individual(id_pieza),
    sku_14 VARCHAR(14) NOT NULL,
    modelo_martela VARCHAR(50) NOT NULL,
    peso_bruto_g NUMERIC(8,4) NOT NULL,
    peso_neto_oro_g NUMERIC(8,4) NOT NULL,
    costo_mo NUMERIC(10,2) NOT NULL,
    costo_metal NUMERIC(10,2) NOT NULL,
    total_martela NUMERIC(10,2) NOT NULL,
    precio_publico_iva NUMERIC(10,2) NOT NULL,
    gramos_oro_fino NUMERIC(8,5) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_salidas_order_id ON salidas_remisiones(order_id);
```

---

## 3. Especificación Estricta del Layout Excel de 16 Columnas (MLS / Coppel)
El generador SheetJS (`exportLayoutExcel16Cols`) exporta con exactitud matemática las 16 columnas requeridas por los departamentos de auditoría de Coppel y Montepío:

| # | Nombre de Columna Oficial | Tipo de Dato | Fuente / Regla |
| :---: | :--- | :--- | :--- |
| **1** | `#` | Entero | Número consecutivo de renglón |
| **2** | `Centro Logístico` | Texto | Nombre y número de tienda destino |
| **3** | `Modelo Martela` | Texto | Clave interna (ej. `MRT-AN-1042`) |
| **4** | `Código de Barras SKU` | Texto (14 dig) | GTIN-14 único impreso en bolsa |
| **5** | `Descripción` | Texto | Ficha comercial de la alhaja |
| **6** | `Kilataje` | Texto | `14K`, `10K` o `PLATA_925` |
| **7** | `Cantidad` | Entero | Cantidad de piezas individuales (`1`) |
| **8** | `Peso Bruto` | Decimal (4 dec) | Lectura física de balanza analítica |
| **9** | `Peso Neto Oro` | Decimal (4 dec) | Peso Bruto menos Circonia de catálogo |
| **10** | `Costo M.O.` | Moneda (MXN) | Costo de Hechura por gramo neto |
| **11** | `Costo Metal` | Moneda (MXN) | Liquidación con Tarifa Máxima Fix |
| **12** | `Total Martela` | Moneda (MXN) | Costo M.O. + Costo Metal |
| **13** | `Margen MLS (70%)` | Moneda (MXN) | Margen comercial pactado en contrato |
| **14** | `Costo Público con IVA` | Moneda (MXN) | `(Total Martela * 1.70) * 1.16` |
| **15** | `Oro Fino Puro` | Decimal (5 dec) | Gramos 24K para saldar cuenta maquila |
| **16** | `Factura SAE` | Texto | Folio de factura Aspel SAE vinculada |

---

## 4. Arquitectura Frontend & Modal-First
- **Asignación Masiva Automatizada**: Botón `⚡ Ejecutar Despiece Masivo B2B` despieza 438 sub-piezas físicas con overlay de carga.
- **Modal de Validación de Sello `openEditSealModal`**:
  - Asigna y valida el folio del sello plástico inviolable (ej. `Z008340`) y el peso total en báscula de la valija antes de sellar.
- **Modal de Remisión Oficial `openRemisionPdfModal`**:
  - Despliega el formato oficial de Hoja de Salida para firma en mostrador con QR fiscal SAT vectorial y desglose en pesos y letras en formato CFDI.

