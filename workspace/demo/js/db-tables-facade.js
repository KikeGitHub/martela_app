/**
 * MARTELA — Fachada de Tablas de Base de Datos Simuladas (db-tables-facade.js)
 * Aísla las 13 tablas exactas del esquema PostgreSQL de los 6 Módulos de Alto Impacto
 * para facilitar su inspección, persistencia en LocalStorage y exportación directa a PostgreSQL (DDL + INSERTs).
 *
 * Tablas PostgreSQL representadas:
 *  1. proveedores
 *  2. productos_sku
 *  3. proveedor_modelo_equivalencia
 *  4. recepciones_paqueteria
 *  5. inspecciones_calidad
 *  6. ubicaciones_gavetas
 *  7. piezas_inventario_individual
 *  8. tasas_metal_fix
 *  9. saldos_maquila_oro_fino
 * 10. clientes_centros_logisticos
 * 11. salidas_remisiones
 * 12. salida_piezas_detalle
 * 13. pld_evidencias_entrega
 */
window.MartelaDbTablesFacade = (function() {
  const STORAGE_KEY = 'martela_enterprise_db';

  function getRawDB() {
    if (window.apiFacade && typeof window.apiFacade._getDB === 'function') {
      return window.apiFacade._getDB();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : (window.MartelaSeed ? window.MartelaSeed.getInitialData() : {});
  }

  /**
   * Devuelve un objeto con las 13 tablas exactas del modelo relacional PostgreSQL.
   */
  function getPostgresTablesSnapshot() {
    const db = getRawDB();

    const proveedores = (db.proveedores || []).map(p => ({
      id: p.id,
      codigo_interno: p.codigo_interno,
      razon_social: p.razon_social,
      pais_origen: p.pais_origen,
      moneda_compra: p.moneda_compra
    }));

    const productos_sku = (db.products_sku || []).map(p => ({
      sku: p.sku_14 || p.sku,
      modelo_martela: p.modelo_martela || p.sku,
      descripcion: p.descripcion,
      tipo_alhaja: p.tipo_alhaja || p.categoria || 'ANILLO',
      metal_tipo: p.metal_tipo || 'ORO_10K',
      medida: p.medida || 'Estándar',
      costo_mo_base: Number(p.costo_mo_base ?? p.costo_hechura_base ?? 180).toFixed(2),
      peso_piedra_cz: Number(p.peso_piedra_cz || 0).toFixed(4),
      factor_oro_fino: Number(p.factor_oro_fino ?? 0.41667).toFixed(5)
    }));

    const proveedor_modelo_equivalencia = (db.products_sku || []).map((p, idx) => ({
      id: idx + 1,
      id_proveedor: p.id_proveedor || 1,
      sku_martela: p.sku_14 || p.sku,
      modelo_proveedor: p.modelo_proveedor || `MOD-PROV-${idx + 1}`,
      descripcion_proveedor: p.descripcion
    }));

    const recepciones_paqueteria = (db.recepciones_paqueteria || []).map(r => ({
      id_recepcion: r.id_recepcion,
      guia_tracking: r.guia_tracking,
      id_proveedor: r.id_proveedor,
      total_bultos: r.total_bultos,
      peso_bruto_paquete_g: Number(r.peso_bruto_paquete_g).toFixed(2),
      url_video_evidencia: r.url_video_evidencia,
      estatus: r.estatus,
      observaciones: r.observaciones,
      fecha_llegada: r.fecha_llegada
    }));

    const inspecciones_calidad = (db.inspecciones_calidad || []).map(i => ({
      id_inspeccion: i.id_inspeccion,
      id_recepcion: i.id_recepcion,
      sku: i.sku_14 || i.sku,
      piezas_recibidas: i.piezas_recibidas,
      piezas_aprobadas: i.piezas_aprobadas,
      piezas_reparacion_interna: i.piezas_reparacion_interna,
      piezas_merma_fundicion: i.piezas_merma_fundicion,
      observaciones_tecnicas: i.observaciones_tecnicas
    }));

    const ubicaciones_gavetas = (db.ubicaciones_gavetas || []).map(g => ({
      id_ubicacion: g.id_ubicacion,
      almacen: g.almacen,
      rack: g.rack,
      nivel: g.nivel,
      gaveta: g.gaveta,
      codigo_completo: g.codigo_completo
    }));

    const piezas_inventario_individual = (db.inventory_pieces || []).map(p => ({
      id_pieza: p.id_pieza || p.piece_id,
      sku_ref: p.sku_14 || p.sku_ref,
      id_recepcion: p.id_recepcion || 101,
      id_ubicacion: 1,
      codigo_gaveta: p.ubicacion_gaveta || 'BOVEDA-R1-N1-G01',
      peso_bruto_g: Number(p.peso_bruto_g).toFixed(4),
      peso_piedra_g: Number(p.peso_piedra_g || 0).toFixed(4),
      peso_neto_metal_g: Number(p.peso_neto_metal_g ?? p.peso_neto_g).toFixed(4),
      gramos_oro_fino: Number(p.gramos_oro_fino || 0).toFixed(5),
      estatus: p.estatus === 'ASIGNADA' ? 'APARTADO_RUTA' : (p.estatus === 'EN_FUNDICION' ? 'FUNDICION' : p.estatus),
      fecha_pesaje: p.fecha_pesaje || p.fecha_ingreso
    }));

    const r = db.metal_rates || {};
    const fixAplicado = Math.max(Number(r.fix_oro_hoy_usd || 2650), Number(r.fix_oro_ayer_usd || 2680));
    const tc = Number(r.tipo_cambio_usd_mxn || 19.5);
    const gramo24k = (fixAplicado * tc) / 31.1035;

    const tasas_metal_fix = [
      {
        id: 1,
        fecha: r.fecha_hoy || '2026-10-17',
        fix_oro_hoy_usd: Number(r.fix_oro_hoy_usd || 2650).toFixed(2),
        fix_oro_ayer_usd: Number(r.fix_oro_ayer_usd || 2680).toFixed(2),
        fix_aplicado: fixAplicado.toFixed(2),
        tipo_cambio_usd_mxn: tc.toFixed(4),
        costo_gramo_10k_mxn: (gramo24k * 0.41667).toFixed(2),
        costo_gramo_14k_mxn: (gramo24k * 0.58333).toFixed(2),
        costo_gramo_plata_mxn: Number(r.costo_gramo_plata_mxn || 24.80).toFixed(2)
      }
    ];

    const saldos_maquila_oro_fino = (db.clients || [])
      .filter(c => Number(c.saldo_oro_fino_g || 0) > 0 || c.id === 'CLI-004')
      .map((c, idx) => ({
        id: idx + 1,
        cliente_id: c.id,
        cliente_nombre: c.nombre,
        saldo_gramos_oro_fino: Number(c.saldo_oro_fino_g || 0).toFixed(5),
        fecha_actualizacion: new Date().toISOString()
      }));

    const clientes_centros_logisticos = db.clientes_centros_logisticos || [];

    const activeOrder = (db.coppel_orders || [])[0] || { sucursales: [] };
    const salidas_remisiones = (activeOrder.sucursales || []).map((s, idx) => ({
      id_remision: idx + 1,
      folio_remision: `REM-2026-${s.numero_sucursal || idx + 1}`,
      id_centro: idx + 1,
      centro_logistico: `${s.numero_sucursal || s.tienda_id} - ${s.nombre}`,
      factura_sae: s.factura_sae || 'SAE-F-90812',
      sello_seguridad_bolsa: s.sello_seguridad_bolsa || 'Z008340',
      total_piezas: s.piezas_solicitadas,
      estatus: s.piezas_asignadas_ids?.length > 0 ? 'EN_RUTA' : 'PREPARADO'
    }));

    const salida_piezas_detalle = [];
    const pld_evidencias_entrega = db.pld_evidencias_entrega || [];

    return {
      proveedores,
      productos_sku,
      proveedor_modelo_equivalencia,
      recepciones_paqueteria,
      inspecciones_calidad,
      ubicaciones_gavetas,
      piezas_inventario_individual,
      tasas_metal_fix,
      saldos_maquila_oro_fino,
      clientes_centros_logisticos,
      salidas_remisiones,
      salida_piezas_detalle,
      pld_evidencias_entrega
    };
  }

  /**
   * Genera un script SQL (INSERT INTO) compatible con PostgreSQL a partir del estado actual de las tablas simuladas.
   */
  function generatePostgresSqlDump() {
    const t = getPostgresTablesSnapshot();
    const escSql = v => (v === null || v === undefined ? 'NULL' : `'${String(v).replace(/'/g, "''")}'`);
    const lines = [
      '-- =========================================================================',
      '-- MARTELA · VOLCADO DE DATOS SIMULADOS A POSTGRESQL (6 MÓDULOS CORE SDOP)',
      `-- Generado: ${new Date().toISOString()}`,
      '-- =========================================================================',
      'BEGIN;',
      ''
    ];

    lines.push('-- 1. Tabla: proveedores');
    t.proveedores.forEach(r => {
      lines.push(
        `INSERT INTO proveedores (id, codigo_interno, razon_social, pais_origen, moneda_compra) VALUES (${r.id}, ${escSql(r.codigo_interno)}, ${escSql(r.razon_social)}, ${escSql(r.pais_origen)}, ${escSql(r.moneda_compra)}) ON CONFLICT (id) DO NOTHING;`
      );
    });

    lines.push('\n-- 2. Tabla: productos_sku');
    t.productos_sku.forEach(r => {
      lines.push(
        `INSERT INTO productos_sku (sku, modelo_martela, descripcion, tipo_alhaja, metal_tipo, medida, costo_mo_base, peso_piedra_cz) VALUES (${escSql(r.sku)}, ${escSql(r.modelo_martela)}, ${escSql(r.descripcion)}, ${escSql(r.tipo_alhaja)}, ${escSql(r.metal_tipo)}, ${escSql(r.medida)}, ${r.costo_mo_base}, ${r.peso_piedra_cz}) ON CONFLICT (sku) DO NOTHING;`
      );
    });

    lines.push('\n-- 3. Tabla: proveedor_modelo_equivalencia');
    t.proveedor_modelo_equivalencia.forEach(r => {
      lines.push(
        `INSERT INTO proveedor_modelo_equivalencia (id, id_proveedor, sku_martela, modelo_proveedor, descripcion_proveedor) VALUES (${r.id}, ${r.id_proveedor}, ${escSql(r.sku_martela)}, ${escSql(r.modelo_proveedor)}, ${escSql(r.descripcion_proveedor)}) ON CONFLICT (modelo_proveedor) DO NOTHING;`
      );
    });

    lines.push('\n-- 4. Tabla: ubicaciones_gavetas');
    t.ubicaciones_gavetas.forEach(r => {
      lines.push(
        `INSERT INTO ubicaciones_gavetas (id_ubicacion, almacen, rack, nivel, gaveta, codigo_completo) VALUES (${r.id_ubicacion}, ${escSql(r.almacen)}, ${escSql(r.rack)}, ${escSql(r.nivel)}, ${escSql(r.gaveta)}, ${escSql(r.codigo_completo)}) ON CONFLICT (codigo_completo) DO NOTHING;`
      );
    });

    lines.push('\n-- 5. Tabla: piezas_inventario_individual (Muestra primeros 100 registros)');
    t.piezas_inventario_individual.slice(0, 100).forEach(r => {
      lines.push(
        `INSERT INTO piezas_inventario_individual (id_pieza, sku_ref, id_recepcion, id_ubicacion, peso_bruto_g, peso_piedra_g, gramos_oro_fino, estatus) VALUES (${escSql(r.id_pieza)}, ${escSql(r.sku_ref)}, ${r.id_recepcion}, ${r.id_ubicacion}, ${r.peso_bruto_g}, ${r.peso_piedra_g}, ${r.gramos_oro_fino}, ${escSql(r.estatus)}) ON CONFLICT (id_pieza) DO NOTHING;`
      );
    });

    lines.push('\n-- 6. Tabla: tasas_metal_fix');
    t.tasas_metal_fix.forEach(r => {
      lines.push(
        `INSERT INTO tasas_metal_fix (fecha, fix_oro_hoy_usd, fix_oro_ayer_usd, fix_aplicado, tipo_cambio_usd_mxn, costo_gramo_10k_mxn, costo_gramo_14k_mxn, costo_gramo_plata_mxn) VALUES (${escSql(r.fecha)}, ${r.fix_oro_hoy_usd}, ${r.fix_oro_ayer_usd}, ${r.fix_aplicado}, ${r.tipo_cambio_usd_mxn}, ${r.costo_gramo_10k_mxn}, ${r.costo_gramo_14k_mxn}, ${r.costo_gramo_plata_mxn}) ON CONFLICT (fecha) DO NOTHING;`
      );
    });

    lines.push('\nCOMMIT;');
    return lines.join('\n');
  }

  function downloadPostgresSqlDump() {
    const sql = generatePostgresSqlDump();
    const filename = `martela-postgres-dump-${new Date().toISOString().slice(0, 10)}.sql`;
    window.MartelaUI.downloadBlob(sql, filename, 'application/sql;charset=utf-8');
    window.MartelaUI.toast(`Script PostgreSQL descargado (${filename})`, 'success');
  }

  return {
    getPostgresTablesSnapshot,
    generatePostgresSqlDump,
    downloadPostgresSqlDump
  };
})();

