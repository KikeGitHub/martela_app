# SDD — Módulo 4: Motor Financiero Fix, Oro Fino y Facturación Bipartita

- **ID Documento**: SDD-MOD-004
- **Módulo**: Cotización Internacional de Metales Preciosos, Regla de Tarifa Máxima y Liquidación Bipartita
- **Versión**: 2.0 (Dual Rates & Account Ledger)
- **Estado**: Aprobado para Fase 3
- **ADR Relacionado**: [ADR-0001](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md), [ADR-0002](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 1. Plan de Reutilización (Audit-First)
- **Entidades Existentes**: Extiende `TasaMetal.java` y `LiquidacionFinanciera.java`.
- **Puertos Frontend**: `src/app/modules/pricing/ports/pricing.repository.ts`.
- **Adaptadores**: `PricingLocalStorageAdapter` y `PricingHttpAdapter`.
- **Controlador Spring Boot**: `com.martela.pricing.infrastructure.rest.FinanzasController`.

---

## 2. Migración SQL DDL (Flyway / PostgreSQL)

```sql
-- 1. Registro Diario de Tasas Internacionales Fix y Tipo de Cambio
CREATE TABLE IF NOT EXISTS tasas_metal_fix (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    fix_oro_hoy_usd NUMERIC(10,2) NOT NULL,
    fix_oro_ayer_usd NUMERIC(10,2) NOT NULL,
    fix_oro_aplicado_usd NUMERIC(10,2) GENERATED ALWAYS AS (
        GREATEST(fix_oro_hoy_usd, fix_oro_ayer_usd)
    ) STORED,
    fix_plata_hoy_usd NUMERIC(10,2) NOT NULL,
    tipo_cambio_usd_mxn NUMERIC(8,4) NOT NULL,
    precio_gramo_oro_24k_mxn NUMERIC(10,4) NOT NULL,
    precio_gramo_plata_mxn NUMERIC(10,4) NOT NULL,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Cuenta Corriente de Oro Fino Puro (Maquila Montepío Luz Saviñón)
CREATE TABLE IF NOT EXISTS saldos_maquila_oro_fino (
    id SERIAL PRIMARY KEY,
    cliente_referencia VARCHAR(80) NOT NULL DEFAULT 'MONTEPIO_LUZ_SAVINON',
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN ('DEPOSITO_ORO_FINO', 'DEBITO_LIQUIDACION', 'AJUSTE_MERMA')),
    gramos_oro_fino NUMERIC(10,5) NOT NULL,
    saldo_resultante_g NUMERIC(10,5) NOT NULL,
    folio_acta VARCHAR(50),
    registrado_por VARCHAR(80) DEFAULT 'Adriana López',
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasas_fecha ON tasas_metal_fix(fecha);
```

---

## 3. Algoritmo Financiero y Reglas Estrictas de Negocio

### A. Regla de Tarifa Máxima Fix
$$\text{FIX Aplicado (USD/oz)} = \max(\text{FIX Hoy}, \text{FIX Ayer})$$
Protege a MARTELA frente a desplomes intradiarios del metal en mercados internacionales (LBMA/Kitco).

### B. Fórmula de Facturación Bipartita
$$\text{Costo M.O. (MXN)} = \text{Peso Neto (g)} \times \text{Costo M.O. Base}$$
$$\text{Costo Metal (MXN)} = \text{Peso Neto (g)} \times \left(\frac{\text{FIX Aplicado}}{31.1035} \times \text{TC} \times \text{Factor Pureza}\right)$$
$$\text{Total Martela} = \text{Costo M.O.} + \text{Costo Metal}$$

### C. Margen Comercial y Venta al Público (MLS / Coppel / Cancún)
- **Oro Fino (Compensación de Maquila)**: Débito de gramos puros en la cuenta corriente Montepío.
- **Plata .925 / Joyería con Margen Comercial**:
  $$\text{Precio Público con IVA} = (\text{Total Martela} \times 1.70) \times 1.16$$

---

## 4. Arquitectura Frontend & Modal-First
- **Modal de Ajuste de Tasas `openModalEditarRates`**:
  - Permite recalcular el FIX de Hoy, FIX de Ayer y TC al instante con loading feedback.
- **Modal de Maquila `openModalMaquila`**:
  - Registro de depósitos físicos de oro o débitos de entrega a 5 decimales con confirmación y auditoría PLD.
- **Simulador Interactivo Bipartito**:
  - Desglose visual en 2 renglones transparentes para el cliente.

