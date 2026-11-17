# SDD — Módulo 2: Recepción de Paquetería, Video-Evidencia y Mesa de Control de Calidad

- **ID Documento**: SDD-MOD-002
- **Módulo**: Recepción de Valijas Aduanales, Trazabilidad en Video y Semáforo de Calidad
- **Versión**: 2.0 (Modal-First & Triaje Físico Reactivo)
- **Estado**: Aprobado para Fase 3
- **ADR Relacionado**: [ADR-0001](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md), [ADR-0002](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 1. Plan de Reutilización (Audit-First)
- **Entidades Existentes**: `Recepcion.java`, `InspeccionCalidad.java`.
- **Puertos Frontend**: `src/app/modules/reception/ports/reception.repository.ts`.
- **Adaptadores**: `ReceptionLocalStorageAdapter` y `ReceptionHttpAdapter`.
- **Controlador Spring Boot**: `com.martela.reception.infrastructure.rest.RecepcionController`.

---

## 2. Migración SQL DDL (Flyway / PostgreSQL)
Tablas base en `V2__martela_6_modulos_core.sql`:

```sql
-- 1. Recepciones de Paquetería Internacional y Custodia
CREATE TABLE IF NOT EXISTS recepciones_paqueteria (
    id_recepcion SERIAL PRIMARY KEY,
    folio_recepcion VARCHAR(30) UNIQUE NOT NULL,
    guia_tracking VARCHAR(80) NOT NULL,
    paqueteria VARCHAR(80) NOT NULL,
    id_proveedor INT REFERENCES proveedores(id),
    total_bultos INT NOT NULL CHECK (total_bultos > 0),
    peso_bruto_paquete_g NUMERIC(10,2) NOT NULL CHECK (peso_bruto_paquete_g > 0),
    url_video_evidencia TEXT NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'EN_REVISION' 
        CHECK (estatus IN ('EN_REVISION', 'CONCILIADO', 'CON_DISCREPANCIA', 'RECHAZADO')),
    observaciones TEXT,
    recibido_por VARCHAR(80) DEFAULT 'David Morales',
    fecha_llegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Inspección por Renglón / Semáforo de Calidad
CREATE TABLE IF NOT EXISTS inspecciones_calidad (
    id_inspeccion SERIAL PRIMARY KEY,
    id_recepcion INT NOT NULL REFERENCES recepciones_paqueteria(id_recepcion) ON DELETE CASCADE,
    sku VARCHAR(30) NOT NULL REFERENCES productos_sku(sku),
    piezas_recibidas INT NOT NULL CHECK (piezas_recibidas >= 0),
    piezas_aprobadas INT NOT NULL DEFAULT 0 CHECK (piezas_aprobadas >= 0),
    piezas_reparacion_interna INT NOT NULL DEFAULT 0 CHECK (piezas_reparacion_interna >= 0),
    piezas_merma_fundicion INT NOT NULL DEFAULT 0 CHECK (piezas_merma_fundicion >= 0),
    observaciones_tecnicas TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_conteo_calidad CHECK (
        (piezas_aprobadas + piezas_reparacion_interna + piezas_merma_fundicion) <= piezas_recibidas
    )
);
CREATE INDEX IF NOT EXISTS idx_recepciones_guia ON recepciones_paqueteria(guia_tracking);
```

---

## 3. Contratos REST y DTOs (Spring Boot)

### POST `/api/v1/recepciones`
- **Request Body** (`CrearRecepcionRequest`):
```json
{
  "guia_tracking": "FDX-7894512039-HK",
  "paqueteria": "FedEx International Priority",
  "id_proveedor": 2,
  "total_bultos": 2,
  "peso_bruto_paquete_g": 1840.50,
  "url_video_evidencia": "https://storage.martela.mx/evidencias/2026-10/unboxing-FDX-789451.mp4",
  "observaciones": "Valija con sellos plásticos intactos verificados."
}
```

### POST `/api/v1/recepciones/{id}/inspecciones/{idInspeccion}/semaforo`
- **Query Params**: `bucket` (`APROBADO` | `REPARACION` | `MERMA`), `delta` (`+1` o `-1`).
- **Transacción**: Mueve la pieza a ubicación virtual correspondiente:
  - `APROBADO`: Habilita la pieza en Báscula Digital (Módulo 3).
  - `REPARACION`: Asigna al taller interno de reparación de engarces y reasas.
  - `MERMA`: Envía a charola de pedacería y fundición metalúrgica.

### POST `/api/v1/recepciones/{id}/finalizar-dictamen`
- Cierra la inspección y sella el acta de apertura de aduana.

---

## 4. Arquitectura Frontend & Ergonomía para Operarios
- **Modal CRUD `openNewReceptionModal`**: Registra nueva guía sin reemplazar la grilla de inspección de la pantalla. Botón con loading spinner.
- **Modal de Video-Evidencia**: Reproduce el visor cenital continuo sin cortes (1080p a 60 FPS) vinculado a la guía de tracking para reclamaciones ante FedEx/Cometra.
- **Botones Táctiles del Semáforo**:
  - `+1 Aprobado (Verde)`: Micro-animación de pulso táctil.
  - `+1 Reparación (Amarillo)`: Requiere nota técnica.
  - `+1 Merma Fundición (Rojo)`: Descuenta tara y metalúrgico.

---

## 5. Plan de Validación Oráculo en Playwright
- Detección de guía consolidada `FDX-7894512039-HK`.
- Apertura del visor de video-evidencia sin excepciones en consola.
- Interacción con botones de semáforo reactivo (+1 Aprobado) y verificación de contadores.

