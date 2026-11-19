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
      moneda_compra: p.moneda_compra,
      factor_merma_oro: Number(p.factor_merma_oro || 0).toFixed(2),
      moneda_defecto: p.moneda_defecto || p.moneda_compra || 'USD'
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

    const ordenes_compra = (db.ordenes_compra || []).map(o => ({
      id_oc: o.id_oc,
      folio_oc: o.folio_oc,
      id_proveedor: o.id_proveedor,
      estatus: o.estatus,
      peso_oro_teorico_total_g: Number(o.peso_oro_teorico_total_g || 0).toFixed(4),
      costo_mo_total_estimado: Number(o.costo_mo_total_estimado || 0).toFixed(2),
      fix_oro_cerrado_usd: o.fix_oro_cerrado_usd ? Number(o.fix_oro_cerrado_usd).toFixed(2) : null,
      tipo_cambio_cerrado: o.tipo_cambio_cerrado ? Number(o.tipo_cambio_cerrado).toFixed(4) : null,
      importe_metal_total: Number(o.importe_metal_total || 0).toFixed(2),
      importe_total_liquidable: Number(o.importe_total_liquidable || 0).toFixed(2),
      fecha_emision: o.fecha_emision,
      fecha_promesa_entrega: o.fecha_promesa_entrega
    }));

    const orden_compra_lineas = (db.orden_compra_lineas || []).map(l => ({
      id_linea: l.id_linea,
      id_oc: l.id_oc,
      sku: l.sku,
      modelo_proveedor: l.modelo_proveedor,
      descripcion: l.descripcion,
      kilataje: l.kilataje,
      cantidad_piezas: l.cantidad_piezas,
      peso_teorico_unitario_g: Number(l.peso_teorico_unitario_g || 0).toFixed(4),
      costo_mo_unitario: Number(l.costo_mo_unitario || 0).toFixed(2),
      peso_packing_unitario_g: Number(l.peso_packing_unitario_g || 0).toFixed(4),
      peso_packing_total_g: Number(l.peso_packing_total_g || 0).toFixed(4),
      variacion_peso_porcentaje: Number(l.variacion_peso_porcentaje || 0).toFixed(2),
      estatus_tolerancia: l.estatus_tolerancia
    }));

    const compras_logistica_importacion = (db.compras_logistica_importacion || []).map(log => ({
      id_logistica: log.id_logistica,
      id_oc: log.id_oc,
      transportista_aerolinea: log.transportista_aerolinea,
      guia_tracking: log.guia_tracking,
      agente_aduanal: log.agente_aduanal,
      costo_flete_divisa: Number(log.costo_flete_divisa || 0).toFixed(2),
      impuestos_aduanales_mxn: Number(log.impuestos_aduanales_mxn || 0).toFixed(2),
      estatus_transito: log.estatus_transito,
      fecha_estimada_arribo: log.fecha_estimada_arribo
    }));

    const proveedor_estado_cuenta = (db.proveedor_estado_cuenta || []).map(mov => ({
      id_movimiento: mov.id_movimiento,
      id_proveedor: mov.id_proveedor,
      id_oc: mov.id_oc,
      tipo_movimiento: mov.tipo_movimiento,
      folio_documento: mov.folio_documento,
      monto_divisa: Number(mov.monto_divisa || 0).toFixed(2),
      observaciones: mov.observaciones,
      fecha_registro: mov.fecha_registro
    }));

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
      pld_evidencias_entrega,
      ordenes_compra,
      orden_compra_lineas,
      compras_logistica_importacion,
      proveedor_estado_cuenta
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

    lines.push('\n-- 7. Tabla: ordenes_compra (Compras Internacionales)');
    (t.ordenes_compra || []).forEach(r => {
      lines.push(
        `INSERT INTO ordenes_compra (id_oc, folio_oc, id_proveedor, estatus, peso_oro_teorico_total_g, costo_mo_total_estimado, fix_oro_cerrado_usd, tipo_cambio_cerrado, importe_metal_total, importe_total_liquidable, fecha_emision, fecha_promesa_entrega) VALUES (${r.id_oc}, ${escSql(r.folio_oc)}, ${r.id_proveedor}, ${escSql(r.estatus)}, ${r.peso_oro_teorico_total_g}, ${r.costo_mo_total_estimado}, ${r.fix_oro_cerrado_usd || 'NULL'}, ${r.tipo_cambio_cerrado || 'NULL'}, ${r.importe_metal_total}, ${r.importe_total_liquidable}, ${escSql(r.fecha_emision)}, ${escSql(r.fecha_promesa_entrega)}) ON CONFLICT (folio_oc) DO NOTHING;`
      );
    });

    lines.push('\n-- 8. Tabla: orden_compra_lineas');
    (t.orden_compra_lineas || []).forEach(r => {
      lines.push(
        `INSERT INTO orden_compra_lineas (id_linea, id_oc, sku, modelo_proveedor, descripcion, kilataje, cantidad_piezas, peso_teorico_unitario_g, costo_mo_unitario, peso_packing_unitario_g, peso_packing_total_g, variacion_peso_porcentaje, estatus_tolerancia) VALUES (${r.id_linea}, ${r.id_oc}, ${escSql(r.sku)}, ${escSql(r.modelo_proveedor)}, ${escSql(r.descripcion)}, ${escSql(r.kilataje)}, ${r.cantidad_piezas}, ${r.peso_teorico_unitario_g}, ${r.costo_mo_unitario}, ${r.peso_packing_unitario_g}, ${r.peso_packing_total_g}, ${r.variacion_peso_porcentaje}, ${escSql(r.estatus_tolerancia)}) ON CONFLICT (id_linea) DO NOTHING;`
      );
    });

    lines.push('\n-- 9. Tabla: compras_logistica_importacion');
    (t.compras_logistica_importacion || []).forEach(r => {
      lines.push(
        `INSERT INTO compras_logistica_importacion (id_logistica, id_oc, transportista_aerolinea, guia_tracking, agente_aduanal, costo_flete_divisa, impuestos_aduanales_mxn, estatus_transito, fecha_estimada_arribo) VALUES (${r.id_logistica}, ${r.id_oc}, ${escSql(r.transportista_aerolinea)}, ${escSql(r.guia_tracking)}, ${escSql(r.agente_aduanal)}, ${r.costo_flete_divisa}, ${r.impuestos_aduanales_mxn}, ${escSql(r.estatus_transito)}, ${escSql(r.fecha_estimada_arribo)}) ON CONFLICT (id_logistica) DO NOTHING;`
      );
    });

    lines.push('\n-- 10. Tabla: proveedor_estado_cuenta');
    (t.proveedor_estado_cuenta || []).forEach(r => {
      lines.push(
        `INSERT INTO proveedor_estado_cuenta (id_movimiento, id_proveedor, id_oc, tipo_movimiento, folio_documento, monto_divisa, observaciones, fecha_registro) VALUES (${r.id_movimiento}, ${r.id_proveedor}, ${r.id_oc || 'NULL'}, ${escSql(r.tipo_movimiento)}, ${escSql(r.folio_documento)}, ${r.monto_divisa}, ${escSql(r.observaciones)}, ${escSql(r.fecha_registro)}) ON CONFLICT (id_movimiento) DO NOTHING;`
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

