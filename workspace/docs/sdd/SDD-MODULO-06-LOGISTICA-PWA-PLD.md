# SDD — Módulo 6: Módulo Logístico PWA, Firma Táctil y Expediente PLD

- **ID Documento**: SDD-MOD-006
- **Módulo**: Aplicación Móvil PWA para Custodio/Chofer, Georreferenciación GPS, Sellos y Expediente Antilavado (PLD)
- **Versión**: 2.0 (Mobile Ergonomics & Forensic Offline Dossier)
- **Estado**: Aprobado para Fase 3
- **ADR Relacionado**: [ADR-0001](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md), [ADR-0002](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 1. Plan de Reutilización (Audit-First)
- **Entidades Existentes**: Extiende `RutaEntrega.java` y `ExpedientePLD.java`.
- **Puertos Frontend**: `src/app/modules/logistics/ports/logistics.repository.ts`.
- **Adaptadores**: `LogisticsLocalStorageAdapter` y `LogisticsHttpAdapter`.
- **Controlador Spring Boot**: `com.martela.logistics.infrastructure.rest.LogisticaPldController`.

---

## 2. Migración SQL DDL (Flyway / PostgreSQL)

```sql
-- 1. Rutas de Custodia y Entrega de Metales
CREATE TABLE IF NOT EXISTS rutas_logistica (
    id_ruta SERIAL PRIMARY KEY,
    codigo_ruta VARCHAR(50) UNIQUE NOT NULL,
    chofer_custodio VARCHAR(80) NOT NULL DEFAULT 'Miguel Torres',
    vehiculo VARCHAR(80) NOT NULL,
    placas VARCHAR(20) NOT NULL,
    estatus VARCHAR(30) NOT NULL DEFAULT 'EN_RUTA'
        CHECK (estatus IN ('PROGRAMADA', 'EN_RUTA', 'FINALIZADA', 'INCIDENCIA')),
    fecha_salida TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Evidencias Forenses de Entrega y Expediente PLD (UIF / SAT)
CREATE TABLE IF NOT EXISTS pld_evidencias_entrega (
    id_evidencia SERIAL PRIMARY KEY,
    folio_expediente VARCHAR(50) UNIQUE NOT NULL,
    id_ruta INT REFERENCES rutas_logistica(id_ruta),
    id_remision INT REFERENCES salidas_remisiones(id_remision),
    parada_id VARCHAR(50) NOT NULL,
    sello_seguridad_recibido VARCHAR(50) NOT NULL,
    receptor_nombre VARCHAR(120) NOT NULL,
    latitud NUMERIC(10,7) NOT NULL,
    longitud NUMERIC(10,7) NOT NULL,
    geo_precision_m NUMERIC(5,2) DEFAULT 4.50,
    firma_digital_base64 TEXT NOT NULL,
    hash_forense_sha256 VARCHAR(64) NOT NULL,
    sincronizado_offline BOOLEAN DEFAULT FALSE,
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pld_folio ON pld_evidencias_entrega(folio_expediente);
```

---

## 3. Contratos REST y DTOs (Spring Boot)

### POST `/api/v1/logistica/rutas/{routeId}/paradas/{paradaId}/confirmar-entrega`
- **Request Body** (`ConfirmarEntregaPldRequest`):
```json
{
  "sello_verificado": "Z008341",
  "receptor_nombre": "Lic. Roberto Garza (Jefe de Bóveda)",
  "latitud": 19.3512800,
  "longitud": -99.1764300,
  "firma_canvas_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "evidencia_sello_url": "acuse-sellado-mostrador-verificado.jpg"
}
```
- **Procesamiento de Seguridad Antilavado**:
  1. Valida que el sello coincida exactamente con la remisión despachada de bóveda central.
  2. Genera el hash criptográfico SHA-256 inmutable de la firma + coordenadas + timestamp.
  3. Marca la remisión como `ENTREGADA`.

---

## 4. Arquitectura Frontend & Modo PWA Offline-First
- **Soporte Offline**: Almacena en `IndexedDB` / `localStorage` cuando el custodio entra en sótano o bóveda sin cobertura celular. Al recuperar red, sincroniza mediante `syncOffline()`.
- **Canvas Táctil de Firma Digital**:
  - Trazado suave con `pointerdown` / `pointermove` adaptado a pantallas móviles y lápices stylus.
  - Validación de firma vacía (`isCanvasSigned`).
- **Modal de Certificación PLD `abrirModalEntregaPld`**:
  - Modal con botón de captura automática de GPS de alta precisión.
  - Botón de confirmación con estado loading (`Certificando Firma y PLD...`).
- **Modal de Auditoría Forense `openPldDossierModal`**:
  - Muestra el sello digital UIF, coordenadas satelitales, firma estampada y hash SHA-256.

