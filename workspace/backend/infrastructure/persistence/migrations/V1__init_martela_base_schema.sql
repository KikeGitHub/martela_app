-- V1__init_martela_base_schema.sql
-- Migración base Flyway para Martela (Joyería Fina y Control de Oro)
-- Cumple con precisión decimal estricta DECIMAL(10,3) para gramajes de metales preciosos.

CREATE TABLE IF NOT EXISTS cat_quilatajes (
    codigo VARCHAR(10) PRIMARY KEY,
    pureza_decimal DECIMAL(6,4) NOT NULL,
    descripcion VARCHAR(50) NOT NULL
);

INSERT INTO cat_quilatajes (codigo, pureza_decimal, descripcion) VALUES
    ('24k', 1.0000, 'Oro Fino Puro 24 Quilates (99.9%)'),
    ('18k', 0.7500, 'Oro 18 Quilates (75.0%)'),
    ('14k', 0.5833, 'Oro 14 Quilates (58.33%)'),
    ('10k', 0.4167, 'Oro 10 Quilates (41.67%)')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS control_oro_lotes (
    id VARCHAR(64) PRIMARY KEY,
    tipo_materia VARCHAR(30) NOT NULL,
    quilataje VARCHAR(10) NOT NULL REFERENCES cat_quilatajes(codigo),
    peso_bruto_gramos DECIMAL(10,3) NOT NULL CHECK (peso_bruto_gramos > 0),
    peso_fino_gramos DECIMAL(10,3) NOT NULL CHECK (peso_fino_gramos > 0),
    merma_permitida_gramos DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    costo_por_gramo_mxn DECIMAL(14,4) NOT NULL,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario_joyas_piezas (
    serial VARCHAR(64) PRIMARY KEY,
    sku VARCHAR(64) NOT NULL,
    nombre_modelo VARCHAR(150) NOT NULL,
    tipo_pieza VARCHAR(30) NOT NULL,
    quilataje VARCHAR(10) NOT NULL REFERENCES cat_quilatajes(codigo),
    peso_bruto_gramos DECIMAL(10,3) NOT NULL CHECK (peso_bruto_gramos > 0),
    pedreria_gemas VARCHAR(255),
    certificado_gemologico VARCHAR(120),
    estatus VARCHAR(30) NOT NULL DEFAULT 'BOVEDA',
    ubicacion_almacen VARCHAR(100) NOT NULL,
    fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventario_joyas_sku ON inventario_joyas_piezas(sku);
CREATE INDEX IF NOT EXISTS idx_inventario_joyas_estatus ON inventario_joyas_piezas(estatus);

