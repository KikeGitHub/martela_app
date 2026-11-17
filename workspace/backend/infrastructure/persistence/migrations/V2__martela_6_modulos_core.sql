-- V2__martela_6_modulos_core.sql
-- Esquema PostgreSQL completo para los 6 Módulos de Alto Impacto de MARTELA (SDOP Framework)

-- =========================================================================
-- MÓDULO 1: CATÁLOGO MAESTRO MULTI-PROVEEDOR Y MATRIZ DE CIRCONIAS (CZ)
-- =========================================================================
CREATE TABLE IF NOT EXISTS proveedores (
    id SERIAL PRIMARY KEY,
    codigo_interno VARCHAR(30) UNIQUE NOT NULL,
    razon_social VARCHAR(150) NOT NULL,
    pais_origen VARCHAR(20) NOT NULL CHECK (pais_origen IN ('CHINA', 'ITALIA', 'TURQUIA', 'MEXICO', 'HONG_KONG')),
    moneda_compra VARCHAR(10) NOT NULL CHECK (moneda_compra IN ('USD', 'EUR', 'MXN'))
);

CREATE TABLE IF NOT EXISTS productos_sku (
    sku VARCHAR(14) PRIMARY KEY,
    modelo_martela VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    tipo_alhaja VARCHAR(40) NOT NULL,
    metal_tipo VARCHAR(20) NOT NULL CHECK (metal_tipo IN ('ORO_10K', 'ORO_14K', 'ORO_18K', 'PLATA_925')),
    medida VARCHAR(30),
    costo_mo_base NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    peso_piedra_cz NUMERIC(8,4) NOT NULL DEFAULT 0.0000 CHECK (peso_piedra_cz >= 0.0000),
    factor_oro_fino NUMERIC(8,5) GENERATED ALWAYS AS (
        CASE
            WHEN metal_tipo = 'ORO_14K' THEN 0.58333
            WHEN metal_tipo = 'ORO_10K' THEN 0.41667
            WHEN metal_tipo = 'ORO_18K' THEN 0.75000
            ELSE 0.00000
        END
    ) STORED
);

CREATE TABLE IF NOT EXISTS proveedor_modelo_equivalencia (
    id SERIAL PRIMARY KEY,
    id_proveedor INT NOT NULL REFERENCES proveedores(id),
    sku_martela VARCHAR(14) NOT NULL REFERENCES productos_sku(sku),
    modelo_proveedor VARCHAR(60) UNIQUE NOT NULL,
    descripcion_proveedor VARCHAR(255)
);

-- =========================================================================
-- MÓDULO 2: RECEPCIÓN DE PAQUETERÍA, VIDEO-EVIDENCIA Y MESA DE CALIDAD
-- =========================================================================
CREATE TABLE IF NOT EXISTS recepciones_paqueteria (
    id_recepcion SERIAL PRIMARY KEY,
    guia_tracking VARCHAR(80) UNIQUE NOT NULL,
    id_proveedor INT NOT NULL REFERENCES proveedores(id),
    total_bultos INT NOT NULL CHECK (total_bultos > 0),
    peso_bruto_paquete_g NUMERIC(10,2) NOT NULL CHECK (peso_bruto_paquete_g > 0),
    url_video_evidencia TEXT NOT NULL,
    estatus VARCHAR(30) NOT NULL CHECK (estatus IN ('EN_REVISION', 'CONCILIADO', 'CON_DISCREPANCIA')),
    observaciones TEXT,
    fecha_llegada TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inspecciones_calidad (
    id_inspeccion SERIAL PRIMARY KEY,
    id_recepcion INT NOT NULL REFERENCES recepciones_paqueteria(id_recepcion),
    sku VARCHAR(14) NOT NULL REFERENCES productos_sku(sku),
    piezas_recibidas INT NOT NULL CHECK (piezas_recibidas >= 0),
    piezas_aprobadas INT NOT NULL DEFAULT 0,
    piezas_reparacion_interna INT NOT NULL DEFAULT 0,
    piezas_merma_fundicion INT NOT NULL DEFAULT 0,
    observaciones_tecnicas TEXT
);

-- =========================================================================
-- MÓDULO 3: BÁSCULA DIGITAL, SUB-PIEZAS INDIVIDUALES Y GAVETAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS ubicaciones_gavetas (
    id_ubicacion SERIAL PRIMARY KEY,
    almacen VARCHAR(30) NOT NULL CHECK (almacen IN ('BOVEDA_ORO', 'RACK_PLATA', 'TAPANCO_FANTASIA', 'DEFECTOS')),
    rack VARCHAR(15) NOT NULL,
    nivel VARCHAR(15) NOT NULL,
    gaveta VARCHAR(15) NOT NULL,
    codigo_completo VARCHAR(60) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS piezas_inventario_individual (
    id_pieza VARCHAR(50) PRIMARY KEY,
    sku_ref VARCHAR(14) NOT NULL REFERENCES productos_sku(sku),
    id_recepcion INT REFERENCES recepciones_paqueteria(id_recepcion),
    id_ubicacion INT NOT NULL REFERENCES ubicaciones_gavetas(id_ubicacion),
    peso_bruto_g NUMERIC(8,4) NOT NULL CHECK (peso_bruto_g > 0),
    peso_piedra_g NUMERIC(8,4) NOT NULL DEFAULT 0.0000,
    peso_neto_metal_g NUMERIC(8,4) GENERATED ALWAYS AS (peso_bruto_g - peso_piedra_g) STORED,
    gramos_oro_fino NUMERIC(8,5) NOT NULL,
    estatus VARCHAR(30) NOT NULL CHECK (estatus IN ('DISPONIBLE', 'APARTADO_RUTA', 'ENTREGADO', 'FUNDICION')),
    fecha_pesaje TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- MÓDULO 4: MOTOR FINANCIERO FIX, ORO FINO Y FACTURACIÓN BIPARTITA
-- =========================================================================
CREATE TABLE IF NOT EXISTS tasas_metal_fix (
    id SERIAL PRIMARY KEY,
    fecha DATE UNIQUE NOT NULL,
    fix_oro_hoy_usd NUMERIC(10,2) NOT NULL,
    fix_oro_ayer_usd NUMERIC(10,2) NOT NULL,
    fix_aplicado NUMERIC(10,2) NOT NULL,
    tipo_cambio_usd_mxn NUMERIC(8,4) NOT NULL,
    costo_gramo_10k_mxn NUMERIC(10,2) NOT NULL,
    costo_gramo_14k_mxn NUMERIC(10,2) NOT NULL,
    costo_gramo_plata_mxn NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS saldos_maquila_oro_fino (
    id SERIAL PRIMARY KEY,
    cliente_id INT NOT NULL,
    saldo_gramos_oro_fino NUMERIC(10,5) NOT NULL DEFAULT 0.00000,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- MÓDULO 5: SALIDAS B2B, DESPIECE POR TIENDAS Y HOJAS DE REMISIÓN
-- =========================================================================
CREATE TABLE IF NOT EXISTS clientes_centros_logisticos (
    id_centro SERIAL PRIMARY KEY,
    cliente VARCHAR(120) NOT NULL,
    numero_sucursal VARCHAR(20) NOT NULL,
    nombre_sucursal VARCHAR(120) NOT NULL,
    zona_ruta VARCHAR(60) NOT NULL,
    direccion TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS salidas_remisiones (
    id_remision SERIAL PRIMARY KEY,
    folio_remision VARCHAR(50) UNIQUE NOT NULL,
    id_centro INT NOT NULL REFERENCES clientes_centros_logisticos(id_centro),
    factura_sae VARCHAR(50),
    sello_seguridad_bolsa VARCHAR(50) NOT NULL,
    total_piezas INT NOT NULL,
    peso_bruto_total_g NUMERIC(10,2) NOT NULL,
    peso_neto_oro_g NUMERIC(10,4) NOT NULL,
    oro_fino_total_g NUMERIC(10,5) NOT NULL,
    importe_total NUMERIC(12,2) NOT NULL,
    estatus VARCHAR(30) NOT NULL CHECK (estatus IN ('PREPARADO', 'EN_RUTA', 'ENTREGADO'))
);

CREATE TABLE IF NOT EXISTS salida_piezas_detalle (
    id_detalle SERIAL PRIMARY KEY,
    id_remision INT NOT NULL REFERENCES salidas_remisiones(id_remision),
    id_pieza VARCHAR(50) NOT NULL REFERENCES piezas_inventario_individual(id_pieza),
    costo_mo NUMERIC(10,2) NOT NULL,
    costo_metal NUMERIC(10,2) NOT NULL
);

-- =========================================================================
-- MÓDULO 6: LOGÍSTICA EN CAMPO, PWA MÓVIL Y EXPEDIENTE DIGITAL PLD
-- =========================================================================
CREATE TABLE IF NOT EXISTS pld_evidencias_entrega (
    id_evidencia SERIAL PRIMARY KEY,
    id_remision INT NOT NULL REFERENCES salidas_remisiones(id_remision),
    auditor_entrega VARCHAR(100) NOT NULL,
    receptor_nombre VARCHAR(100) NOT NULL,
    firma_digital_base64 TEXT NOT NULL,
    foto_comprobante_url TEXT,
    latitud NUMERIC(10,8) NOT NULL,
    longitud NUMERIC(11,8) NOT NULL,
    fecha_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estatus_auditoria VARCHAR(30) NOT NULL CHECK (estatus_auditoria IN ('PENDIENTE', 'VALIDADO'))
);

