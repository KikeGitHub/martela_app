/**
 * MARTELA — Capa de Servicios y Fachada API (ApiFacade)
 * Implementa el Patrón Facade desacoplando la interfaz de usuario de la persistencia LocalStorage
 * y simulando la latencia de red mediante Promises (preparado para futura migración a Spring Boot).
 */
class ApiFacade {
  constructor() {
    this.storageKey = 'martela_enterprise_db';
    this.initDatabase();
  }

  initDatabase(forceReset = false) {
    if (forceReset || !localStorage.getItem(this.storageKey)) {
      if (window.MartelaSeed) {
        const initial = window.MartelaSeed.getInitialData();
        localStorage.setItem(this.storageKey, JSON.stringify(initial));
      }
    }
  }

  _getDB() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        this.initDatabase(true);
        return JSON.parse(localStorage.getItem(this.storageKey));
      }
      const parsed = JSON.parse(data);
      // Actualizar automáticamente si se agregaron nuevos proveedores o productos desde el libro oficial
      if (typeof window !== 'undefined' && window.MartelaWorkbookData) {
        if (!parsed.products_sku || parsed.products_sku.length < 500) {
          const seed = window.MartelaSeed ? window.MartelaSeed.getInitialData() : {};
          parsed.products_sku = seed.products_sku;
          parsed.proveedores = seed.proveedores;
          parsed.proveedor_modelo_equivalencia = seed.proveedor_modelo_equivalencia;
          this._saveDB(parsed);
        }
      }

      // Migración suave si faltan nuevas colecciones de los 6 módulos SDOP o CFDI 4.0
      if (
        !parsed.payments_cxc ||
        !parsed.credit_notes ||
        !parsed.invoices?.[0]?.uuid ||
        !parsed.proveedores ||
        !parsed.recepciones_paqueteria ||
        !parsed.ubicaciones_gavetas ||
        !parsed.products_sku?.[0]?.sku_14
      ) {
        const seed = window.MartelaSeed ? window.MartelaSeed.getInitialData() : {};
        if (!parsed.proveedores) parsed.proveedores = seed.proveedores || [];
        if (!parsed.proveedor_modelo_equivalencia) parsed.proveedor_modelo_equivalencia = seed.proveedor_modelo_equivalencia || [];
        if (!parsed.recepciones_paqueteria) parsed.recepciones_paqueteria = seed.recepciones_paqueteria || [];
        if (!parsed.inspecciones_calidad) parsed.inspecciones_calidad = seed.inspecciones_calidad || [];
        if (!parsed.ubicaciones_gavetas) parsed.ubicaciones_gavetas = seed.ubicaciones_gavetas || [];
        if (!parsed.clientes_centros_logisticos) parsed.clientes_centros_logisticos = seed.clientes_centros_logisticos || [];
        if (!parsed.pld_evidencias_entrega) parsed.pld_evidencias_entrega = seed.pld_evidencias_entrega || [];
        if (!parsed.pwa_offline_queue) parsed.pwa_offline_queue = seed.pwa_offline_queue || [];
        if (seed.products_sku && (!parsed.products_sku?.[0]?.sku_14)) {
          parsed.products_sku = seed.products_sku;
        }
        if (seed.inventory_pieces && (!parsed.inventory_pieces?.[0]?.ubicacion_gaveta)) {
          parsed.inventory_pieces = seed.inventory_pieces;
        }
        if (seed.coppel_orders && (!parsed.coppel_orders?.[0]?.sello_seguridad_bolsa)) {
          parsed.coppel_orders = seed.coppel_orders;
        }
        if (seed.routes && (!parsed.routes?.[0]?.paradas?.[0]?.sello_seguridad_bolsa)) {
          parsed.routes = seed.routes;
        }
        if (!parsed.payments_cxc) parsed.payments_cxc = seed.payments_cxc || [];
        if (!parsed.credit_notes) parsed.credit_notes = seed.credit_notes || [];
        if (seed.invoices && (!parsed.invoices || !parsed.invoices[0]?.uuid)) {
          parsed.invoices = seed.invoices;
        }
        if (seed.clients && parsed.clients && !parsed.clients[0]?.regimen_fiscal) {
          parsed.clients = seed.clients;
        }
        if (seed.metal_rates) {
          parsed.metal_rates = { ...seed.metal_rates, ...parsed.metal_rates };
        }
        if (!parsed.ordenes_compra) {
          parsed.ordenes_compra = seed.ordenes_compra || [];
          parsed.orden_compra_lineas = seed.orden_compra_lineas || [];
          parsed.compras_logistica_importacion = seed.compras_logistica_importacion || [];
          parsed.proveedor_estado_cuenta = seed.proveedor_estado_cuenta || [];
        }
        this._saveDB(parsed);
      }

      // Autocuración y actualización del Set Completo de Prueba (8 fases completas del Módulo 0)
      if (!parsed.ordenes_compra || !Array.isArray(parsed.ordenes_compra) || parsed.ordenes_compra.length < 8) {
        const seed = window.MartelaSeed ? window.MartelaSeed.getInitialData() : {};
        parsed.ordenes_compra = seed.ordenes_compra || [];
        parsed.orden_compra_lineas = seed.orden_compra_lineas || [];
        parsed.compras_logistica_importacion = seed.compras_logistica_importacion || [];
        parsed.proveedor_estado_cuenta = seed.proveedor_estado_cuenta || [];
        this._saveDB(parsed);
      }
      return parsed;
    } catch (e) {
      this.initDatabase(true);
      return JSON.parse(localStorage.getItem(this.storageKey));
    }
  }

  _saveDB(db) {
    localStorage.setItem(this.storageKey, JSON.stringify(db));
  }

  // Simulación de retraso de red REST API (120ms - 220ms)
  async _simulateNetwork(ms = 150) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Auditoría centralizada
  async audit(action, entity, recordId, result = "Correcto") {
    const db = this._getDB();
    const currentUser = window.MartelaAuth?.getCurrentUser() || { name: 'Sistema', role: 'Sistema' };
    const log = {
      id: `AUD-${Date.now()}`,
      fecha: new Date().toLocaleString('es-MX', { hour12: false }),
      usuario: currentUser.name,
      rol: currentUser.role,
      accion: action,
      entidad: entity,
      registro_id: String(recordId),
      resultado: result
    };
    db.audit_logs.unshift(log);
    db.audit_logs = db.audit_logs.slice(0, 500); // Límite 500
    this._saveDB(db);
    return log;
  }

  // ==========================================
  // 1. DASHBOARD & MÉTRICAS GENERALES
  // ==========================================
  async getDashboardSummary() {
    await this._simulateNetwork();
    const db = this._getDB();
    const rates = db.metal_rates;
    const fixMayor = Math.max(rates.fix_oro_hoy_usd, rates.fix_oro_ayer_usd);
    const precioGramoFino = (fixMayor * rates.tipo_cambio_usd_mxn) / 31.1035;

    const availablePieces = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE');
    const totalGramsAvailable = availablePieces.reduce((sum, p) => sum + p.peso_neto_g, 0);

    // Valuación estimada de inventario disponible
    let valorEstimadoTotal = 0;
    availablePieces.forEach(piece => {
      const prod = db.products_sku.find(p => p.sku === piece.sku_ref);
      const pureza = rates.coeficientes[prod?.quilataje || '10K'] || 0.4167;
      const costoMetal = piece.peso_neto_g * precioGramoFino * pureza;
      const hechura = prod?.costo_hechura_base || 180;
      valorEstimadoTotal += (costoMetal + hechura);
    });

    // Pedidos pendientes
    const openOrders = db.coppel_orders.filter(o => o.estatus !== 'ENTREGADO');

    // Alertas de campeones / bajo stock
    const lowStockSku = db.products_sku.filter(sku => {
      const count = availablePieces.filter(p => p.sku_ref === sku.sku).length;
      return count < sku.stock_minimo;
    });

    return {
      piezas_disponibles: availablePieces.length,
      peso_neto_disponible_g: +totalGramsAvailable.toFixed(2),
      valor_estimado_mxn: +valorEstimadoTotal.toFixed(2),
      pedidos_abiertos: openOrders.length,
      alertas_reorden_campeones: lowStockSku.length,
      almacenes_count: db.warehouses.length,
      fix_aplicado_usd: fixMayor,
      precio_gramo_fino_mxn: +precioGramoFino.toFixed(2),
      actividad_reciente: db.audit_logs.slice(0, 6)
    };
  }

  // ==========================================
  // 2. CATÁLOGO & INVENTARIO POR PIEZA INDIVIDUAL
  // ==========================================
  async getProductsCatalog() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.products_sku;
  }

  async getPieceInventoryBySKU(sku) {
    await this._simulateNetwork();
    const db = this._getDB();
    const prod = db.products_sku.find(p => p.sku === sku);
    const pieces = db.inventory_pieces.filter(p => p.sku_ref === sku && p.estatus !== 'VENDIDA');
    const available = pieces.filter(p => p.estatus === 'DISPONIBLE');
    const totalGrams = pieces.reduce((sum, p) => sum + p.peso_neto_g, 0);

    return {
      producto: prod,
      sku: sku,
      total_piezas: pieces.length,
      disponibles_count: available.length,
      total_gramos: +totalGrams.toFixed(2),
      piezas: pieces
    };
  }

  async getInventoryMasterTable(filters = {}) {
    await this._simulateNetwork();
    const db = this._getDB();
    const { query = '', almacen = '', quilataje = '', estatus = '' } = filters;

    // Agrupar por SKU
    return db.products_sku.map(prod => {
      let pieces = db.inventory_pieces.filter(p => p.sku_ref === prod.sku);
      
      if (almacen) pieces = pieces.filter(p => p.almacen_id === almacen);
      if (estatus) pieces = pieces.filter(p => p.estatus === estatus);

      const disponibles = pieces.filter(p => p.estatus === 'DISPONIBLE');
      const totalGrams = pieces.reduce((s, p) => s + p.peso_neto_g, 0);

      return {
        ...prod,
        piezas_total: pieces.length,
        piezas_disponibles: disponibles.length,
        peso_neto_total_g: +totalGrams.toFixed(2),
        sub_piezas: pieces,
        alerta_stock: disponibles.length < prod.stock_minimo
      };
    }).filter(item => {
      if (quilataje && item.quilataje !== quilataje) return false;
      if (!query) return true;
      const q = query.toLowerCase();
      return item.sku.toLowerCase().includes(q) ||
             item.descripcion.toLowerCase().includes(q) ||
             item.categoria.toLowerCase().includes(q);
    });
  }

  async createPhysicalPiece(pieceData) {
    await this._simulateNetwork();
    const db = this._getDB();
    const { sku_ref, peso_bruto_g, peso_neto_g, almacen_id, estatus = 'DISPONIBLE' } = pieceData;

    if (!sku_ref || !peso_neto_g || !peso_bruto_g || !almacen_id) {
      throw new Error("Datos incompletos para registrar la pieza física.");
    }
    if (peso_neto_g > peso_bruto_g) {
      throw new Error("El peso neto no puede exceder al peso bruto.");
    }

    db.counter = (db.counter || 500) + 1;
    const piece_id = `PZ-2026-${String(db.counter).padStart(4, "0")}`;

    const newPiece = {
      piece_id,
      sku_ref,
      peso_bruto_g: +peso_bruto_g.toFixed(2),
      peso_neto_g: +peso_neto_g.toFixed(2),
      almacen_id,
      estatus,
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      order_id: null,
      box_id: null,
      store_id: null
    };

    db.inventory_pieces.unshift(newPiece);
    this._saveDB(db);
    await this.audit('ALTA_PIEZA', 'Inventario', piece_id, `${peso_neto_g}g en ${almacen_id}`);
    return newPiece;
  }

  async transferPiece(pieceId, targetWarehouseId) {
    await this._simulateNetwork();
    const db = this._getDB();
    const piece = db.inventory_pieces.find(p => p.piece_id === pieceId);

    if (!piece) throw new Error("Pieza física no encontrada.");
    if (piece.estatus !== 'DISPONIBLE') {
      throw new Error(`Solo se pueden transferir piezas DISPONIBLES (Estatus actual: ${piece.estatus}).`);
    }

    const previousWarehouse = piece.almacen_id;
    piece.almacen_id = targetWarehouseId;

    // Si se transfiere al taller de fundición, cambia su estatus
    if (targetWarehouseId === 'TALLER_FUNDICION') {
      piece.estatus = 'EN_FUNDICION';
    }

    this._saveDB(db);
    await this.audit('TRANSFERENCIA_PIEZA', 'Inventario', pieceId, `${previousWarehouse} ➔ ${targetWarehouseId}`);
    return piece;
  }

  // ==========================================
  // 3. MOTOR DE COTIZACIÓN DINÁMICA (FIX ORO)
  // ==========================================
  async getMetalRates() {
    await this._simulateNetwork(80);
    const db = this._getDB();
    const r = db.metal_rates;
    const fixMayor = Math.max(r.fix_oro_hoy_usd, r.fix_oro_ayer_usd);
    const regla = r.fix_oro_ayer_usd >= r.fix_oro_hoy_usd ? "FIX DE AYER (Mayor valor)" : "FIX DE HOY (Mayor valor)";
    const precioGramoFino = (fixMayor * r.tipo_cambio_usd_mxn) / 31.1035;

    return {
      ...r,
      fix_aplicado_usd: fixMayor,
      regla_descripcion: regla,
      precio_gramo_fino_mxn: +precioGramoFino.toFixed(2)
    };
  }

  async updateMetalRates(newRates) {
    await this._simulateNetwork();
    const db = this._getDB();
    db.metal_rates = {
      ...db.metal_rates,
      ...newRates,
      fecha_hoy: new Date().toISOString().slice(0, 10)
    };
    this._saveDB(db);
    await this.audit('ACTUALIZACION_METALES', 'Cotizador', 'FIX', `Hoy: $${newRates.fix_oro_hoy_usd} | Ayer: $${newRates.fix_oro_ayer_usd}`);
    return this.getMetalRates();
  }

  async calculateDynamicPrice(pesoGramos, hechura, quilataje = "10K") {
    await this._simulateNetwork(60);
    const db = this._getDB();
    const rates = db.metal_rates;
    const fixMayor = Math.max(rates.fix_oro_hoy_usd, rates.fix_oro_ayer_usd);
    const pureza = rates.coeficientes[quilataje] || 0.4167;
    const precioGramoFino = (fixMayor * rates.tipo_cambio_usd_mxn) / 31.1035;
    const precioGramoQuilataje = precioGramoFino * pureza;
    const costoMetal = pesoGramos * precioGramoQuilataje;
    const precioFinal = costoMetal + hechura;

    return {
      fix_usado: fixMayor,
      precio_gramo_fino: +precioGramoFino.toFixed(2),
      pureza_porcentaje: (pureza * 100).toFixed(1) + "%",
      precio_gramo_quilataje: +precioGramoQuilataje.toFixed(2),
      costo_metal: +costoMetal.toFixed(2),
      costo_hechura: +hechura.toFixed(2),
      precio_final: +precioFinal.toFixed(2)
    };
  }

  // ==========================================
  // 4. MÓDULO COPPEL B2B (DESPIECE Y EMBARQUE)
  // ==========================================
  async getCoppelOrders() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.coppel_orders;
  }

  async getCoppelOrderById(orderId) {
    await this._simulateNetwork();
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido Coppel no encontrado.");
    return order;
  }

  async assignPiecesToCoppelOrder(orderId) {
    await this._simulateNetwork(350);
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido no encontrado.");

    const available = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE');
    const needed = order.total_piezas - order.piezas_asignadas;

    if (available.length < needed) {
      throw new Error(`Inventario insuficiente: Se requieren ${needed} piezas disponibles en bóveda y solo hay ${available.length}.`);
    }

    // Asignación determinista por tienda y caja
    let assignedIndex = 0;
    order.sucursales.forEach(sucursal => {
      const faltantesTienda = sucursal.piezas_solicitadas - sucursal.piezas_asignadas_ids.length;
      if (faltantesTienda > 0) {
        for (let i = 0; i < faltantesTienda; i++) {
          const piece = available[assignedIndex++];
          piece.estatus = 'ASIGNADA';
          piece.order_id = orderId;
          piece.store_id = sucursal.tienda_id;
          piece.box_id = `CAJA-${String(sucursal.caja_sugerida).padStart(2, '0')}`;
          sucursal.piezas_asignadas_ids.push(piece.piece_id);
        }
        sucursal.estatus_empaque = 'LISTO_PARA_EMPAQUE';
      }
    });

    order.piezas_asignadas = order.total_piezas;
    order.estatus = 'CONCILIADO_100';

    this._saveDB(db);
    await this.audit('ASIGNACION_MASIVA_COPPEL', 'Pedido B2B', orderId, `${needed} piezas asignadas a 26 sucursales`);
    return order;
  }

  async confirmAndDeductCoppelInventory(orderId) {
    await this._simulateNetwork(300);
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido no encontrado.");

    if (order.piezas_asignadas < order.total_piezas) {
      throw new Error("No se puede despachar: la orden aún no está conciliada al 100%. Ejecute el surtido automático primero.");
    }

    // Descontar inventario real cambiando estatus de ASIGNADA a DESPACHADO_COPPEL
    let descontadas = 0;
    order.sucursales.forEach(sucursal => {
      (sucursal.piezas_asignadas_ids || []).forEach(pieceId => {
        const piece = db.inventory_pieces.find(p => p.piece_id === pieceId);
        if (piece) {
          piece.estatus = 'DESPACHADO_COPPEL';
          piece.fecha_despacho = new Date().toISOString();
          descontadas++;
        }
      });
      sucursal.estatus_empaque = 'DESPACHADO';
    });

    order.estatus = 'DESPACHADO';
    order.fecha_despacho = new Date().toISOString();

    this._saveDB(db);
    await this.audit('DESPACHO_COPPEL_DESCUENTO_STOCK', 'Inventario Bóveda', orderId, `${descontadas} piezas físicas descontadas de bóveda y transferidas a ruta`);
    return { order, descontadas };
  }

  async createCoppelOrderFromLayout(layoutData) {
    await this._simulateNetwork(200);
    const db = this._getDB();
    
    // Generar consecutivo único tipo COP-2026-W46-XXXX
    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = layoutData.order_id || `COP-${year}-W${weekNumber}-${randomSuffix}`;

    const baseOrder = db.coppel_orders[0] || {};
    const sucursalesTemplate = (baseOrder.sucursales || []).map((s, idx) => ({
      ...s,
      piezas_asignadas_ids: [],
      estatus_empaque: 'PENDIENTE',
      sello_seguridad_bolsa: `Z00${8340 + idx}`
    }));

    const newOrder = {
      order_id: orderId,
      numero_orden: orderId,
      cliente: "Montepío Luz Saviñón / Coppel B2B",
      fecha_descarga_portal: new Date().toISOString(),
      fecha_descarga: new Date().toISOString().slice(0, 10),
      fecha_entrega: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      total_piezas_solicitadas: layoutData.total_piezas || 438,
      total_piezas: layoutData.total_piezas || 438,
      total_piezas_surtidas: 0,
      piezas_asignadas: 0,
      sello_seguridad_bolsa: "Z008340",
      factura_sae: `SAE-F-${Math.floor(90000 + Math.random() * 9999)}`,
      peso_bolsa_verificado_g: 0,
      estatus: "CARGADO",
      archivo_origen_nombre: layoutData.fileName || "Coppel_Pedido_Semanal_W46.xlsx",
      notas: `Pedido consolidado para ${sucursalesTemplate.length} sucursales/CEDIS importado desde portal Coppel`,
      sucursales: sucursalesTemplate
    };

    // Poner como primera orden activa
    db.coppel_orders.unshift(newOrder);
    this._saveDB(db);
    await this.audit('CARGA_LAYOUT_COPPEL', 'Portal Coppel', orderId, `Cargado layout con ${newOrder.total_piezas} piezas en ${newOrder.sucursales.length} sucursales`);
    return newOrder;
  }

  // ==========================================
  // 5. FACTURACIÓN ELECTRÓNICA & CFDI 4.0 (ASPEL-SAE SUITE)
  // ==========================================

  _generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16).toUpperCase();
    });
  }

  _generateSello() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let s = '';
    for (let i = 0; i < 172; i++) s += chars.charAt(Math.floor(Math.random() * chars.length));
    return s;
  }

  async getInvoices(filters = {}) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    let res = [...db.invoices];
    if (filters.cliente_id) res = res.filter(i => i.cliente_id === filters.cliente_id);
    if (filters.estatus_sat) res = res.filter(i => i.estatus_sat === filters.estatus_sat);
    if (filters.estatus_pago) res = res.filter(i => i.estatus_pago === filters.estatus_pago);
    if (filters.tipo_comprobante) res = res.filter(i => i.tipo_comprobante === filters.tipo_comprobante);
    return res;
  }

  async getInvoiceById(id) {
    await this._simulateNetwork(50);
    const db = this._getDB();
    return db.invoices.find(i => i.id === id) || null;
  }

  async getClients() {
    await this._simulateNetwork(60);
    const db = this._getDB();
    return db.clients;
  }

  async saveClient(clientData) {
    await this._simulateNetwork(100);
    const db = this._getDB();
    const idx = db.clients.findIndex(c => c.id === clientData.id);
    if (idx >= 0) {
      db.clients[idx] = { ...db.clients[idx], ...clientData };
    } else {
      const newId = `CLI-${String(db.clients.length + 1).padStart(3, '0')}`;
      clientData.id = newId;
      db.clients.push(clientData);
    }
    this._saveDB(db);
    await this.audit('GUARDAR_CLIENTE_FISCAL', 'Catálogo Clientes', clientData.rfc, clientData.razon_social || clientData.nombre);
    return clientData;
  }

  async generateInvoiceForOrder(orderId, options = {}) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId);
    if (!order) throw new Error("Pedido no encontrado.");

    if (db.invoices.some(i => i.order_id === orderId && i.estatus_sat === 'VIGENTE')) {
      throw new Error("Ya existe una factura vigente emitida para este pedido.");
    }

    const assignedPieces = db.inventory_pieces.filter(p => p.order_id === orderId);
    if (assignedPieces.length === 0) {
      throw new Error("El pedido aún no tiene piezas físicas asignadas con serial.");
    }

    const rates = await this.getMetalRates();
    const precioGramoFino = rates.precio_gramo_fino_mxn;
    const client = db.clients.find(c => c.nombre === order.cliente || c.id === 'CLI-001') || db.clients[0];

    // Agrupar piezas por SKU para desglose de conceptos CFDI 4.0
    const skuMap = {};
    let totalGramos = 0;
    let subtotal = 0;

    assignedPieces.forEach(p => {
      totalGramos += p.peso_neto_g;
      if (!skuMap[p.sku_ref]) {
        const prod = db.products_sku.find(x => x.sku === p.sku_ref);
        skuMap[p.sku_ref] = {
          sku: p.sku_ref,
          descripcion: prod?.descripcion || p.sku_ref,
          quilataje: prod?.quilataje || '10K',
          clave_sat: "54111601", // Joyería de Oro SAT
          unidad_sat: "H87", // Pieza
          cantidad: 0,
          peso_neto_g: 0,
          hechura_unit: prod?.costo_hechura_base || 180,
          piezas_ids: []
        };
      }
      skuMap[p.sku_ref].cantidad++;
      skuMap[p.sku_ref].peso_neto_g += p.peso_neto_g;
      skuMap[p.sku_ref].piezas_ids.push(p.id);
    });

    const partidas = Object.values(skuMap).map(item => {
      const pureza = rates.coeficientes[item.quilataje] || 0.4167;
      const costoMetalPartida = item.peso_neto_g * precioGramoFino * pureza;
      const hechuraPartida = item.hechura_unit * item.cantidad;
      const importePartida = +(costoMetalPartida + hechuraPartida).toFixed(2);
      const valorUnitario = +(importePartida / item.cantidad).toFixed(2);
      const ivaPartida = +(importePartida * 0.16).toFixed(2);
      subtotal += importePartida;
      return {
        sku: item.sku,
        descripcion: item.descripcion,
        clave_sat: item.clave_sat,
        unidad_sat: item.unidad_sat,
        cantidad: item.cantidad,
        peso_neto_g: +item.peso_neto_g.toFixed(2),
        valor_unitario: valorUnitario,
        importe: importePartida,
        iva: ivaPartida,
        piezas_ids: item.piezas_ids.slice(0, 10) // Muestra representativa
      };
    });

    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto).toFixed(2);
    const folioNum = 1042 + db.invoices.length;
    const invId = `FAC-2026-${folioNum}`;
    const metodoPago = options.metodo_pago || client.metodo_pago_defecto || "PPD";
    const formaPago = options.forma_pago || (metodoPago === "PPD" ? "99" : (client.forma_pago_defecto || "03"));
    const uuid = this._generateUUID();

    const diasCredito = client.dias_credito || 30;
    const fechaEmision = new Date();
    const fechaVence = new Date();
    fechaVence.setDate(fechaEmision.getDate() + diasCredito);

    const newInvoice = {
      id: invId,
      serie: "A",
      folio: folioNum,
      uuid: uuid,
      order_id: orderId,
      cliente_id: client.id,
      cliente: client.nombre,
      razon_social: client.razon_social || client.nombre,
      rfc: client.rfc,
      regimen_fiscal: client.regimen_fiscal || "601",
      cp_fiscal: client.cp_fiscal || "80000",
      uso_cfdi: options.uso_cfdi || client.uso_cfdi || "G01",
      fecha: fechaEmision.toISOString().slice(0, 19),
      fecha_vencimiento: fechaVence.toISOString().slice(0, 10),
      tipo_comprobante: "I",
      metodo_pago: metodoPago,
      forma_pago: formaPago,
      forma_pago_desc: formaPago === "99" ? "Por definir (PPD)" : "Transferencia electrónica (SPEI)",
      condiciones_pago: metodoPago === "PPD" ? `Crédito ${diasCredito} días` : "Contado comercial",
      subtotal: +subtotal.toFixed(2),
      impuesto_iva: impuesto,
      total: total,
      saldo_pendiente: metodoPago === "PPD" ? total : 0.00,
      estatus_pago: metodoPago === "PPD" ? "PENDIENTE" : "PAGADA",
      estatus_sat: "VIGENTE",
      piezas_count: assignedPieces.length,
      gramos_totales: +totalGramos.toFixed(2),
      vinculo_pld: `PLD-AUD-${Date.now().toString().slice(-6)}`,
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello(),
      no_certificado: "30001000000500003416",
      no_certificado_sat: "00001000000504465028",
      fecha_timbrado: fechaEmision.toISOString().slice(0, 19),
      partidas: partidas
    };

    db.invoices.unshift(newInvoice);
    order.estatus = 'FACTURADO';
    order.sucursales.forEach(s => s.factura_folio = invId);

    // Marcar piezas como FACTURADA
    assignedPieces.forEach(p => p.estatus = 'FACTURADA');

    this._saveDB(db);
    await this.audit('EMISION_CFDI_40', 'Facturación', invId, `UUID: ${uuid} | Total: $${total} MXN (${assignedPieces.length} piezas / ${newInvoice.gramos_totales}g)`);
    return newInvoice;
  }

  async createInvoiceDirect(data) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const client = db.clients.find(c => c.id === data.cliente_id) || db.clients[0];
    if (!client) throw new Error("Cliente fiscal no seleccionado.");

    if (!data.partidas || data.partidas.length === 0) {
      throw new Error("Debe agregar al menos una partida a la factura.");
    }

    let subtotal = 0;
    let totalGramos = 0;
    let totalPiezas = 0;

    const partidasFormateadas = data.partidas.map(p => {
      const cant = parseInt(p.cantidad) || 1;
      const vu = parseFloat(p.valor_unitario) || 0;
      const peso = parseFloat(p.peso_neto_g) || 0;
      const imp = +(cant * vu).toFixed(2);
      const iva = +(imp * 0.16).toFixed(2);
      subtotal += imp;
      totalGramos += peso;
      totalPiezas += cant;
      return {
        sku: p.sku || "JOYERIA-ORO",
        descripcion: p.descripcion || "Joyería Fina de Oro Martela",
        clave_sat: "54111601",
        unidad_sat: "H87",
        cantidad: cant,
        peso_neto_g: +peso.toFixed(2),
        valor_unitario: vu,
        importe: imp,
        iva: iva,
        piezas_ids: p.piezas_ids || []
      };
    });

    const impuesto = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + impuesto).toFixed(2);
    const folioNum = 1042 + db.invoices.length;
    const invId = `FAC-2026-${folioNum}`;
    const uuid = this._generateUUID();
    const metodoPago = data.metodo_pago || client.metodo_pago_defecto || "PUE";
    const formaPago = data.forma_pago || (metodoPago === "PPD" ? "99" : (client.forma_pago_defecto || "03"));
    const diasCredito = metodoPago === "PPD" ? (client.dias_credito || 15) : 0;

    const fechaEmision = new Date();
    const fechaVence = new Date();
    fechaVence.setDate(fechaEmision.getDate() + diasCredito);

    const newInvoice = {
      id: invId,
      serie: "A",
      folio: folioNum,
      uuid: uuid,
      order_id: data.order_id || "VENTA-DIRECTA",
      cliente_id: client.id,
      cliente: client.nombre,
      razon_social: client.razon_social || client.nombre,
      rfc: client.rfc,
      regimen_fiscal: client.regimen_fiscal || "601",
      cp_fiscal: client.cp_fiscal || "06000",
      uso_cfdi: data.uso_cfdi || client.uso_cfdi || "G01",
      fecha: fechaEmision.toISOString().slice(0, 19),
      fecha_vencimiento: fechaVence.toISOString().slice(0, 10),
      tipo_comprobante: "I",
      metodo_pago: metodoPago,
      forma_pago: formaPago,
      forma_pago_desc: formaPago === "03" ? "Transferencia electrónica (SPEI)" : formaPago === "01" ? "Efectivo" : formaPago === "17" ? "Compensación oro fino" : "Por definir",
      condiciones_pago: metodoPago === "PPD" ? `Crédito ${diasCredito} días` : "Contado comercial",
      subtotal: +subtotal.toFixed(2),
      impuesto_iva: impuesto,
      total: total,
      saldo_pendiente: metodoPago === "PPD" ? total : 0.00,
      estatus_pago: metodoPago === "PPD" ? "PENDIENTE" : "PAGADA",
      estatus_sat: "VIGENTE",
      piezas_count: totalPiezas,
      gramos_totales: +totalGramos.toFixed(2),
      vinculo_pld: `PLD-AUD-${Date.now().toString().slice(-6)}`,
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello(),
      no_certificado: "30001000000500003416",
      no_certificado_sat: "00001000000504465028",
      fecha_timbrado: fechaEmision.toISOString().slice(0, 19),
      partidas: partidasFormateadas
    };

    // Actualizar piezas físicas seleccionadas a FACTURADA
    const allPieceIds = partidasFormateadas.flatMap(p => p.piezas_ids);
    allPieceIds.forEach(id => {
      const piece = db.inventory_pieces.find(p => p.id === id);
      if (piece) piece.estatus = 'FACTURADA';
    });

    db.invoices.unshift(newInvoice);
    this._saveDB(db);
    await this.audit('EMISION_FACTURA_DIRECTA', 'Facturación', invId, `Cliente: ${client.nombre} | UUID: ${uuid} | Total: $${total} MXN`);
    return newInvoice;
  }

  async cancelInvoice(invoiceId, reason = '02') {
    await this._simulateNetwork(120);
    const db = this._getDB();
    const inv = db.invoices.find(i => i.id === invoiceId);
    if (!inv) throw new Error("Factura no encontrada.");

    if (inv.estatus_sat === 'CANCELADA') {
      throw new Error("Esta factura ya fue cancelada ante el SAT.");
    }

    inv.estatus_sat = 'CANCELADA';
    inv.fecha_cancelacion = new Date().toISOString();
    inv.motivo_cancelacion_sat = reason;
    inv.saldo_pendiente = 0.00;
    inv.estatus_pago = 'CANCELADA';

    // Liberar piezas físicas a inventario DISPONIBLE si corresponde
    if (inv.partidas) {
      const pieceIds = inv.partidas.flatMap(p => p.piezas_ids || []);
      pieceIds.forEach(pid => {
        const p = db.inventory_pieces.find(x => x.id === pid);
        if (p && p.estatus === 'FACTURADA') p.estatus = 'DISPONIBLE';
      });
    }

    this._saveDB(db);
    await this.audit('CANCELACION_CFDI', 'Facturación', invoiceId, `UUID: ${inv.uuid} | Motivo SAT: ${reason}`);
    return inv;
  }

  async getCxCSummary() {
    await this._simulateNetwork(80);
    const db = this._getDB();
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const pendientes = db.invoices.filter(i => i.estatus_sat === 'VIGENTE' && i.saldo_pendiente > 0);
    let totalPorCobrar = 0;
    let totalVencido = 0;
    let totalCorriente = 0;

    const clienteMap = {};

    pendientes.forEach(i => {
      totalPorCobrar += i.saldo_pendiente;
      const esVencida = i.fecha_vencimiento && i.fecha_vencimiento < todayStr;
      if (esVencida) {
        totalVencido += i.saldo_pendiente;
      } else {
        totalCorriente += i.saldo_pendiente;
      }

      if (!clienteMap[i.cliente_id]) {
        const client = db.clients.find(c => c.id === i.cliente_id);
        clienteMap[i.cliente_id] = {
          cliente_id: i.cliente_id,
          cliente: i.cliente,
          rfc: i.rfc,
          limite_credito: client?.limite_credito || 1000000,
          saldo_total: 0,
          saldo_vencido: 0,
          facturas_count: 0,
          facturas: []
        };
      }
      clienteMap[i.cliente_id].saldo_total += i.saldo_pendiente;
      if (esVencida) clienteMap[i.cliente_id].saldo_vencido += i.saldo_pendiente;
      clienteMap[i.cliente_id].facturas_count++;
      clienteMap[i.cliente_id].facturas.push(i);
    });

    return {
      total_por_cobrar: +totalPorCobrar.toFixed(2),
      total_vencido: +totalVencido.toFixed(2),
      total_corriente: +totalCorriente.toFixed(2),
      facturas_pendientes_count: pendientes.length,
      clientes_cartera: Object.values(clienteMap)
    };
  }

  async getPayments(filters = {}) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    let res = [...(db.payments_cxc || [])];
    if (filters.factura_id) res = res.filter(p => p.factura_id === filters.factura_id);
    if (filters.cliente_id) res = res.filter(p => p.cliente_id === filters.cliente_id);
    return res;
  }

  async registerPayment(paymentData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const inv = db.invoices.find(i => i.id === paymentData.factura_id);
    if (!inv) throw new Error("Factura a abonar no encontrada.");

    if (inv.estatus_sat !== 'VIGENTE') {
      throw new Error("No se puede registrar pago a una factura cancelada.");
    }

    if (inv.saldo_pendiente <= 0) {
      throw new Error("La factura ya se encuentra liquidada en su totalidad.");
    }

    const monto = +parseFloat(paymentData.monto).toFixed(2);
    if (isNaN(monto) || monto <= 0) {
      throw new Error("Monto de pago inválido.");
    }

    if (monto > inv.saldo_pendiente) {
      throw new Error(`El monto ($${monto.toLocaleString()}) excede el saldo pendiente ($${inv.saldo_pendiente.toLocaleString()}).`);
    }

    const saldoAnterior = inv.saldo_pendiente;
    const saldoInsoluto = +(saldoAnterior - monto).toFixed(2);
    inv.saldo_pendiente = saldoInsoluto;
    inv.estatus_pago = saldoInsoluto <= 0.01 ? "PAGADA" : "PARCIAL";

    // Si el pago es compensación de oro fino (Forma 17), deducir gramos del cliente
    if (paymentData.forma_pago === '17') {
      const client = db.clients.find(c => c.id === inv.cliente_id);
      const gramosDeducir = parseFloat(paymentData.gramos_oro_compensados) || (monto / 1650);
      if (client && client.saldo_oro_fino_g) {
        client.saldo_oro_fino_g = Math.max(0, +(client.saldo_oro_fino_g - gramosDeducir).toFixed(2));
      }
    }

    const pagNum = 500 + (db.payments_cxc?.length || 0) + 1;
    const pagId = `PAG-2026-${String(pagNum).padStart(3, '0')}`;
    const uuid = this._generateUUID();
    const numParcialidad = (db.payments_cxc?.filter(p => p.factura_id === inv.id).length || 0) + 1;

    const newPayment = {
      id: pagId,
      serie: "P",
      folio: pagNum,
      uuid: uuid,
      factura_id: inv.id,
      factura_uuid: inv.uuid,
      cliente_id: inv.cliente_id,
      cliente: inv.cliente,
      rfc: inv.rfc,
      fecha: new Date().toISOString().slice(0, 19),
      monto: monto,
      forma_pago: paymentData.forma_pago || "03",
      forma_pago_desc: paymentData.forma_pago_desc || (paymentData.forma_pago === "17" ? "Compensación en oro fino" : "Transferencia electrónica (SPEI)"),
      numero_operacion: paymentData.numero_operacion || `SPEI-${Date.now().toString().slice(-7)}`,
      saldo_anterior: saldoAnterior,
      saldo_insoluto: saldoInsoluto,
      num_parcialidad: numParcialidad,
      estatus_sat: "VIGENTE",
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello(),
      notas: paymentData.notas || "Abono a cuenta comercial"
    };

    if (!db.payments_cxc) db.payments_cxc = [];
    db.payments_cxc.unshift(newPayment);

    this._saveDB(db);
    await this.audit('COMPLEMENTO_PAGO_REP', 'Cobranza', pagId, `Factura: ${inv.id} | Abono: $${monto} MXN | Saldo Insoluto: $${saldoInsoluto} MXN`);
    return newPayment;
  }

  async getCreditNotes(filters = {}) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    let res = [...(db.credit_notes || [])];
    if (filters.factura_id) res = res.filter(n => n.factura_id === filters.factura_id);
    return res;
  }

  async createCreditNote(ncData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const inv = db.invoices.find(i => i.id === ncData.factura_id);
    if (!inv) throw new Error("Factura origen no encontrada.");

    const subtotal = +parseFloat(ncData.subtotal).toFixed(2);
    if (isNaN(subtotal) || subtotal <= 0) throw new Error("Subtotal de la nota de crédito inválido.");

    const iva = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + iva).toFixed(2);

    // Ajustar saldo de la factura si tiene saldo pendiente
    if (inv.saldo_pendiente > 0) {
      inv.saldo_pendiente = Math.max(0, +(inv.saldo_pendiente - total).toFixed(2));
      if (inv.saldo_pendiente <= 0.01) inv.estatus_pago = "PAGADA";
    }

    // Si se canalizan piezas a fundición
    if (ncData.canalizar_a_fundicion && ncData.peso_g) {
      const fundLog = {
        id: `FUN-2026-${String(db.foundry_logs.length + 1).padStart(3, '0')}`,
        fecha: new Date().toISOString().slice(0, 10),
        tecnico: "Control de Calidad / Devoluciones",
        piezas_origen: [`DEV-${inv.id}`],
        peso_entrada_g: parseFloat(ncData.peso_g) || 5.0,
        peso_recuperado_g: 0,
        diferencia_g: 0,
        merma_confirmada_g: 0,
        bote_rebabas_analisis_g: 0,
        estatus: "EN_COLA_FUNDICION",
        ley_oro_obtenida: "Por fundir",
        acta_folio: `DEV-NC-${Date.now().toString().slice(-4)}`,
        notas: `Piezas devueltas amparadas por nota de crédito. Motivo: ${ncData.motivo}`
      };
      db.foundry_logs.unshift(fundLog);
    }

    const ncNum = 100 + (db.credit_notes?.length || 0) + 1;
    const ncId = `NC-2026-${String(ncNum).padStart(3, '0')}`;
    const uuid = this._generateUUID();

    const newNC = {
      id: ncId,
      serie: "NC",
      folio: ncNum,
      uuid: uuid,
      factura_id: inv.id,
      factura_uuid: inv.uuid,
      cliente_id: inv.cliente_id,
      cliente: inv.cliente,
      rfc: inv.rfc,
      fecha: new Date().toISOString().slice(0, 19),
      subtotal: subtotal,
      impuesto_iva: iva,
      total: total,
      motivo: ncData.motivo || "Devolución o bonificación comercial",
      tipo_relacion: "01",
      tipo_relacion_desc: "Nota de crédito de los documentos relacionados",
      estatus_sat: "VIGENTE",
      sello_cfd: this._generateSello(),
      sello_sat: this._generateSello()
    };

    if (!db.credit_notes) db.credit_notes = [];
    db.credit_notes.unshift(newNC);

    this._saveDB(db);
    await this.audit('NOTA_CREDITO_CFDI', 'Facturación', ncId, `Factura Origen: ${inv.id} | Total NC: $${total} MXN | Motivo: ${newNC.motivo}`);
    return newNC;
  }

  // ==========================================
  // GENERADORES FORMALES DE XML CFDI 4.0
  // ==========================================

  generateCFDI40XML(inv) {
    const escXml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const conceptosXml = (inv.partidas || []).map(p => `
    <cfdi:Concepto ClaveProdServ="${p.clave_sat || '54111601'}" NoIdentificacion="${escXml(p.sku)}" Cantidad="${p.cantidad}" ClaveUnidad="${p.unidad_sat || 'H87'}" Unidad="Pieza" Descripcion="${escXml(p.descripcion)} (Peso neto: ${p.peso_neto_g}g)" ValorUnitario="${p.valor_unitario.toFixed(2)}" Importe="${p.importe.toFixed(2)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${p.importe.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${p.iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/TimbreFiscalDigital http://www.sat.gob.mx/sitio_internet/cfd/TimbreFiscalDigital/TimbreFiscalDigitalv11.xsd" Version="4.0" Serie="${inv.serie || 'A'}" Folio="${inv.folio || '1001'}" Fecha="${inv.fecha}" Sello="${inv.sello_cfd || this._generateSello()}" FormaPago="${inv.forma_pago || '03'}" NoCertificado="${inv.no_certificado || '30001000000500003416'}" SubTotal="${inv.subtotal.toFixed(2)}" Moneda="MXN" Total="${inv.total.toFixed(2)}" TipoDeComprobante="${inv.tipo_comprobante || 'I'}" Exportacion="01" MetodoPago="${inv.metodo_pago || 'PUE'}" LugarExpedicion="44100">
  <cfdi:Emisor Rfc="MAR880915XYZ" Nombre="MARTELA JOYERIA FINA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${inv.rfc || 'XAXX010101000'}" Nombre="${escXml(inv.razon_social || inv.cliente)}" DomicilioFiscalReceptor="${inv.cp_fiscal || '06000'}" RegimenFiscalReceptor="${inv.regimen_fiscal || '601'}" UsoCFDI="${inv.uso_cfdi || 'G01'}"/>
  <cfdi:Conceptos>${conceptosXml}
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${inv.impuesto_iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${inv.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${inv.impuesto_iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${inv.uuid}" FechaTimbrado="${inv.fecha_timbrado || inv.fecha}" RfcProvCertif="SAT970701NN3" SelloCFD="${inv.sello_cfd || this._generateSello()}" NoCertificadoSAT="${inv.no_certificado_sat || '00001000000504465028'}" SelloSAT="${inv.sello_sat || this._generateSello()}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
  }

  generateREPDocumentXML(payment) {
    const escXml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:pago20="http://www.sat.gob.mx/Pagos20" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Serie="${payment.serie || 'P'}" Folio="${payment.folio || '501'}" Fecha="${payment.fecha}" Sello="${payment.sello_cfd || this._generateSello()}" NoCertificado="30001000000500003416" SubTotal="0" Moneda="XXX" Total="0" TipoDeComprobante="P" Exportacion="01" LugarExpedicion="44100">
  <cfdi:Emisor Rfc="MAR880915XYZ" Nombre="MARTELA JOYERIA FINA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${payment.rfc}" Nombre="${escXml(payment.cliente)}" DomicilioFiscalReceptor="80000" RegimenFiscalReceptor="601" UsoCFDI="CP01"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="1" ClaveUnidad="ACT" Descripcion="Pago" ValorUnitario="0" Importe="0" ObjetoImp="01"/>
  </cfdi:Conceptos>
  <cfdi:Complemento>
    <pago20:Pagos Version="2.0">
      <pago20:Totales MontoTotalPagos="${payment.monto.toFixed(2)}"/>
      <pago20:Pago FechaPago="${payment.fecha}" FormaDePagoP="${payment.forma_pago}" MonedaP="MXN" Monto="${payment.monto.toFixed(2)}" NumOperacion="${escXml(payment.numero_operacion)}">
        <pago20:DoctoRelacionado IdDocumento="${payment.factura_uuid}" Serie="A" Folio="${payment.factura_id}" MonedaDR="MXN" NumParcialidad="${payment.num_parcialidad}" ImpSaldoAnt="${payment.saldo_anterior.toFixed(2)}" ImpPagado="${payment.monto.toFixed(2)}" ImpSaldoInsoluto="${payment.saldo_insoluto.toFixed(2)}" ObjetoImpDR="01"/>
      </pago20:Pago>
    </pago20:Pagos>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${payment.uuid}" FechaTimbrado="${payment.fecha}" RfcProvCertif="SAT970701NN3" SelloCFD="${payment.sello_cfd || this._generateSello()}" NoCertificadoSAT="00001000000504465028" SelloSAT="${payment.sello_sat || this._generateSello()}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
  }

  generateNCXML(nc) {
    const escXml = str => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" Version="4.0" Serie="${nc.serie || 'NC'}" Folio="${nc.folio || '101'}" Fecha="${nc.fecha}" Sello="${nc.sello_cfd || this._generateSello()}" FormaPago="03" NoCertificado="30001000000500003416" SubTotal="${nc.subtotal.toFixed(2)}" Moneda="MXN" Total="${nc.total.toFixed(2)}" TipoDeComprobante="E" Exportacion="01" MetodoPago="PUE" LugarExpedicion="44100">
  <cfdi:CfdiRelacionados TipoRelacion="01">
    <cfdi:CfdiRelacionado UUID="${nc.factura_uuid}"/>
  </cfdi:CfdiRelacionados>
  <cfdi:Emisor Rfc="MAR880915XYZ" Nombre="MARTELA JOYERIA FINA" RegimenFiscal="601"/>
  <cfdi:Receptor Rfc="${nc.rfc}" Nombre="${escXml(nc.cliente)}" DomicilioFiscalReceptor="97000" RegimenFiscalReceptor="601" UsoCFDI="G02"/>
  <cfdi:Conceptos>
    <cfdi:Concepto ClaveProdServ="84111506" NoIdentificacion="NC-DESCUENTO" Cantidad="1" ClaveUnidad="ACT" Unidad="Servicio" Descripcion="${escXml(nc.motivo)}" ValorUnitario="${nc.subtotal.toFixed(2)}" Importe="${nc.subtotal.toFixed(2)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${nc.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${nc.impuesto_iva.toFixed(2)}"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>
  </cfdi:Conceptos>
  <cfdi:Impuestos TotalImpuestosTrasladados="${nc.impuesto_iva.toFixed(2)}">
    <cfdi:Traslados>
      <cfdi:Traslado Base="${nc.subtotal.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${nc.impuesto_iva.toFixed(2)}"/>
    </cfdi:Traslados>
  </cfdi:Impuestos>
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital Version="1.1" UUID="${nc.uuid}" FechaTimbrado="${nc.fecha}" RfcProvCertif="SAT970701NN3" SelloCFD="${nc.sello_cfd || this._generateSello()}" NoCertificadoSAT="00001000000504465028" SelloSAT="${nc.sello_sat || this._generateSello()}"/>
  </cfdi:Complemento>
</cfdi:Comprobante>`;
  }

  // ==========================================
  // 6. LOGÍSTICA PWA CHOFER & ENTREGAS (PLD)
  // ==========================================
  async getRoutes() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.routes;
  }

  async confirmDeliveryStop(routeId, paradaId, deliveryData) {
    await this._simulateNetwork(200);
    const db = this._getDB();
    const route = db.routes.find(r => r.id === routeId);
    if (!route) throw new Error("Ruta no encontrada.");

    const stop = route.paradas.find(p => p.parada_id === paradaId);
    if (!stop) throw new Error("Parada no encontrada.");

    const { receptor_nombre, firma_canvas_data, evidencia_sello_url, observaciones } = deliveryData;

    stop.estatus = 'ENTREGADA';
    stop.hora_llegada = stop.hora_llegada || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    stop.hora_salida = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    stop.receptor_nombre = receptor_nombre;
    stop.firma_canvas_data = firma_canvas_data;
    stop.evidencia_sello_url = evidencia_sello_url;
    stop.observaciones = observaciones || stop.observaciones;

    // Si todas las paradas terminaron, marcar ruta como completa
    if (route.paradas.every(p => p.estatus === 'ENTREGADA')) {
      route.estatus = 'COMPLETADA';
    }

    this._saveDB(db);
    await this.audit('ENTREGA_CONCILIADA_PLD', 'Logística PWA', `${routeId} / ${stop.sucursal}`, `Recibió: ${receptor_nombre} | Sello Adjunto`);
    return stop;
  }

  // ==========================================
  // 7. TALLER DE FUNDICIÓN Y MERMAS
  // ==========================================
  async getFoundryLogs() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.foundry_logs;
  }

  async createFoundryBatch(batchData) {
    await this._simulateNetwork();
    const db = this._getDB();
    const { peso_entrada_g, peso_recuperado_g, tecnico, notas } = batchData;

    if (peso_recuperado_g > peso_entrada_g) {
      throw new Error("El peso recuperado no puede exceder al peso de entrada de metal.");
    }

    const diferencia = +(peso_entrada_g - peso_recuperado_g).toFixed(2);
    // Estimación controlada de merma real vs residuo recuperable
    const merma_confirmada = +(diferencia * 0.20).toFixed(2);
    const bote_rebabas = +(diferencia - merma_confirmada).toFixed(2);

    const id = `FUN-2026-${String(db.foundry_logs.length + 2).padStart(3, '0')}`;
    const newBatch = {
      id,
      fecha: new Date().toISOString().slice(0, 10),
      tecnico: tecnico || "Roberto Silva",
      piezas_origen: ["LOTE-ROT-" + Date.now().toString().slice(-4)],
      peso_entrada_g: +peso_entrada_g.toFixed(2),
      peso_recuperado_g: +peso_recuperado_g.toFixed(2),
      diferencia_g: diferencia,
      merma_confirmada_g: merma_confirmada,
      bote_rebabas_analisis_g: bote_rebabas,
      estatus: "PENDIENTE_CONCILIACION",
      ley_oro_obtenida: "14K (58.3%)",
      acta_folio: `ACTA-FUND-${Date.now().toString().slice(-4)}`,
      notas: notas || "Fusión interna con control de rebabas."
    };

    db.foundry_logs.unshift(newBatch);
    this._saveDB(db);
    await this.audit('LOTE_FUNDICION', 'Fundición', id, `Entrada: ${peso_entrada_g}g | Salida: ${peso_recuperado_g}g | Dif: ${diferencia}g`);
    return newBatch;
  }

  // ==========================================
  // 8. INTELIGENCIA DE STOCK & CAMPEONES
  // ==========================================
  async getStockIntelligenceReport() {
    await this._simulateNetwork();
    const db = this._getDB();
    const pieces = db.inventory_pieces.filter(p => p.estatus === 'DISPONIBLE');

    return db.products_sku.map(prod => {
      const disponibles = pieces.filter(p => p.sku_ref === prod.sku).length;
      const consumoDiarioSimulado = prod.es_campeon ? 2.5 : 0.8;
      const diasInventario = +(disponibles / consumoDiarioSimulado).toFixed(0);
      const puntoReorden = +(consumoDiarioSimulado * prod.lead_time_dias).toFixed(0);
      const riesgoDesabasto = disponibles < prod.stock_minimo;
      const sugerenciaCompra = riesgoDesabasto ? Math.max(prod.stock_minimo * 2 - disponibles, 30) : 0;

      return {
        sku: prod.sku,
        descripcion: prod.descripcion,
        quilataje: prod.quilataje,
        es_campeon: prod.es_campeon,
        disponibles: disponibles,
        stock_minimo: prod.stock_minimo,
        lead_time_dias: prod.lead_time_dias,
        dias_inventario: diasInventario,
        punto_reorden: puntoReorden,
        riesgo_desabasto: riesgoDesabasto,
        sugerencia_compra: sugerenciaCompra
      };
    });
  }

  // ==========================================
  // 9. MAQUILA & MONTEPÍO
  // ==========================================
  async getMaquilaCompensations() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.maquila_compensations;
  }

  // ==========================================
  // 10. AUDITORÍA & RESTAURACIÓN
  // ==========================================
  async getAuditLogs() {
    await this._simulateNetwork();
    const db = this._getDB();
    return db.audit_logs;
  }

  async resetDemo() {
    this.initDatabase(true);
    await this.audit('REINICIO_SISTEMA', 'Sistema', 'RESET', 'Restablecimiento a valores de demostración iniciales');
    return true;
  }

  async exportBackupJSON() {
    const db = this._getDB();
    return JSON.stringify(db, null, 2);
  }

  // =========================================================================
  // MÓDULO 1 SDOP: CATÁLOGO MAESTRO MULTI-PROVEEDOR Y MATRIZ DE CIRCONIAS (CZ)
  // =========================================================================
  async getSuppliers() {
    await this._simulateNetwork(60);
    return this._getDB().proveedores || [];
  }

  async searchProductsCatalog(query = '', filters = {}) {
    await this._simulateNetwork(70);
    const db = this._getDB();
    const q = String(query || '').trim().toLowerCase();
    const { metal_tipo = '', id_proveedor = '' } = filters;
    const allPieces = db.inventory_pieces || [];

    return (db.products_sku || []).map(p => {
      const pieces = allPieces.filter(ip => ip.sku_ref === p.sku || ip.sku_14 === p.sku_14);
      const disponibles = pieces.filter(ip => ip.estatus === 'DISPONIBLE');
      const totalGrams = pieces.reduce((s, ip) => s + Number(ip.peso_neto_metal_g ?? ip.peso_neto_g ?? 0), 0);
      const totalFine = pieces.reduce((s, ip) => s + Number(ip.gramos_oro_fino || 0), 0);
      const gavetasMap = {};
      pieces.forEach(ip => {
        const loc = ip.ubicacion_gaveta || 'BOVEDA-R1-N2-G05';
        gavetasMap[loc] = (gavetasMap[loc] || 0) + 1;
      });

      return {
        ...p,
        piezas_total: pieces.length,
        piezas_disponibles: disponibles.length,
        peso_neto_total_g: +totalGrams.toFixed(4),
        oro_fino_total_g: +totalFine.toFixed(5),
        gavetas_desglose: gavetasMap
      };
    }).filter(p => {
      if (metal_tipo && p.metal_tipo !== metal_tipo) return false;
      if (id_proveedor && String(p.id_proveedor) !== String(id_proveedor)) return false;
      if (!q) return true;
      return (
        String(p.sku || '').toLowerCase().includes(q) ||
        String(p.sku_14 || '').toLowerCase().includes(q) ||
        String(p.modelo_martela || '').toLowerCase().includes(q) ||
        String(p.modelo_proveedor || '').toLowerCase().includes(q) ||
        String(p.descripcion || '').toLowerCase().includes(q) ||
        String(p.proveedor_nombre || '').toLowerCase().includes(q)
      );
    });
  }

  async saveProductCatalogItem(data) {
    await this._simulateNetwork(120);
    const db = this._getDB();
    const prov = (db.proveedores || []).find(pr => String(pr.id) === String(data.id_proveedor)) || db.proveedores[0];
    const metalTipo = data.metal_tipo || 'ORO_10K';
    const factorOroFino =
      metalTipo === 'ORO_14K' ? 0.58333 :
      metalTipo === 'ORO_10K' ? 0.41667 :
      metalTipo === 'ORO_18K' ? 0.75000 : 0.00000;
    const quilataje =
      metalTipo === 'ORO_14K' ? '14K' :
      metalTipo === 'ORO_10K' ? '10K' :
      metalTipo === 'ORO_18K' ? '18K' : 'PLATA_925';

    const sku14 = String(data.sku_14 || '').trim() || `07502278${String(Math.floor(100000 + Math.random() * 900000))}`;
    const skuKey = String(data.sku || data.modelo_martela || sku14).toUpperCase().trim();
    const pesoCz = +Math.max(0, Number(data.peso_piedra_cz || 0)).toFixed(4);
    const costoMo = +Math.max(0, Number(data.costo_mo_base || 180)).toFixed(2);

    const record = {
      sku: skuKey,
      sku_14: sku14,
      modelo_martela: data.modelo_martela || skuKey,
      modelo_proveedor: data.modelo_proveedor || `PROV-${Date.now().toString().slice(-4)}`,
      id_proveedor: prov.id,
      proveedor_nombre: prov.razon_social,
      pais_origen: prov.pais_origen,
      descripcion: data.descripcion || 'Alhaja Fina Martela',
      tipo_alhaja: data.tipo_alhaja || 'ANILLO',
      categoria: data.categoria || 'Anillos',
      metal_tipo: metalTipo,
      tipo_metal: metalTipo === 'PLATA_925' ? 'PLATA_925' : 'ORO_AMARILLO',
      quilataje,
      medida: data.medida || 'Estándar',
      costo_mo_base: costoMo,
      costo_hechura_base: costoMo,
      peso_piedra_cz: pesoCz,
      factor_oro_fino: factorOroFino,
      es_campeon: Boolean(data.es_campeon),
      stock_minimo: Number(data.stock_minimo || 30),
      lead_time_dias: Number(data.lead_time_dias || prov.lead_time_dias || 60),
      activo: true
    };

    const existingIdx = db.products_sku.findIndex(
      x => x.sku === record.sku || x.sku_14 === record.sku_14
    );
    if (existingIdx >= 0) {
      db.products_sku[existingIdx] = { ...db.products_sku[existingIdx], ...record };
    } else {
      db.products_sku.unshift(record);
    }

    this._saveDB(db);
    await this.audit(
      existingIdx >= 0 ? 'ACTUALIZAR_SKU_CZ' : 'ALTA_SKU_MULTI_PROVEEDOR',
      'Catálogo Maestro',
      record.sku_14,
      `${record.modelo_martela} (${record.modelo_proveedor}) · CZ: -${pesoCz.toFixed(4)}g · Factor: ${factorOroFino}`
    );
    return record;
  }

  async deleteProductCatalogItem(sku) {
    await this._simulateNetwork(120);
    const db = this._getDB();
    const idx = (db.products_sku || []).findIndex(p => p.sku === sku || p.sku_14 === sku);
    if (idx < 0) {
      throw new Error(`El producto con SKU ${sku} no existe en el catálogo.`);
    }
    const [removed] = db.products_sku.splice(idx, 1);
    this._saveDB(db);
    await this.audit('ELIMINAR_SKU', 'Catálogo Maestro', removed.sku_14 || removed.sku, `Eliminado ${removed.modelo_martela}`);
    return removed;
  }

  async importCatalogCZMatrix(entries = []) {
    await this._simulateNetwork(180);
    const db = this._getDB();
    let updatedCount = 0;

    entries.forEach(item => {
      const target = db.products_sku.find(
        p =>
          p.sku === item.sku ||
          p.sku_14 === item.sku_14 ||
          p.modelo_martela === item.modelo_martela ||
          p.modelo_proveedor === item.modelo_proveedor
      );
      if (target && item.peso_piedra_cz !== undefined) {
        target.peso_piedra_cz = +Number(item.peso_piedra_cz).toFixed(4);
        if (item.costo_mo_base !== undefined) {
          target.costo_mo_base = +Number(item.costo_mo_base).toFixed(2);
          target.costo_hechura_base = target.costo_mo_base;
        }
        updatedCount++;
      }
    });

    this._saveDB(db);
    await this.audit('IMPORTACION_MASIVA_MATRIZ_CZ', 'Catálogo Maestro', `LOTE-${updatedCount}`, `${updatedCount} modelos actualizados en descuento paramétrico de circonia`);
    return { updatedCount, totalCatalog: db.products_sku.length };
  }

  // =========================================================================
  // MÓDULO 2 SDOP: RECEPCIÓN DE PAQUETERÍA, VIDEO-EVIDENCIA Y MESA DE CALIDAD
  // =========================================================================
  async getReceptions() {
    await this._simulateNetwork(70);
    const db = this._getDB();
    return (db.recepciones_paqueteria || []).map(rec => ({
      ...rec,
      inspecciones: (db.inspecciones_calidad || []).filter(i => i.id_recepcion === rec.id_recepcion)
    }));
  }

  async createPackageReception(payload) {
    await this._simulateNetwork(140);
    const db = this._getDB();
    const prov = (db.proveedores || []).find(p => String(p.id) === String(payload.id_proveedor)) || db.proveedores[0];
    const nextId = (db.recepciones_paqueteria.reduce((m, r) => Math.max(m, r.id_recepcion), 100) || 100) + 1;

    const newRec = {
      id_recepcion: nextId,
      folio_recepcion: `REC-2026-0${nextId}`,
      paqueteria: payload.paqueteria || 'FedEx International Priority',
      guia_tracking: payload.guia_tracking || `FDX-${Date.now().toString().slice(-10)}`,
      id_proveedor: prov.id,
      proveedor_nombre: prov.razon_social,
      pais_origen: prov.pais_origen,
      total_bultos: Math.max(1, parseInt(payload.total_bultos) || 1),
      peso_bruto_paquete_g: +Number(payload.peso_bruto_paquete_g || 1000).toFixed(2),
      url_video_evidencia: payload.url_video_evidencia || 'https://storage.martela.mx/evidencias/2026-10/unboxing-cam01.mp4',
      responsable_recepcion: payload.responsable_recepcion || 'David Morales (Almacén y Control)',
      estatus: 'EN_REVISION',
      observaciones: payload.observaciones || 'Apertura grabada en cámara cenital continua.',
      fecha_llegada: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    db.recepciones_paqueteria.unshift(newRec);

    // Crear líneas iniciales de inspección para los SKUs seleccionados
    const skus = Array.isArray(payload.skus_lote) && payload.skus_lote.length > 0
      ? payload.skus_lote
      : [{ sku: 'ANILLO-SOL-10K', piezas_recibidas: 25 }, { sku: 'ARETE-ARO-14K', piezas_recibidas: 20 }];

    let nextInspId = (db.inspecciones_calidad.reduce((m, i) => Math.max(m, i.id_inspeccion), 0) || 0) + 1;
    skus.forEach(line => {
      const prod = db.products_sku.find(p => p.sku === line.sku || p.sku_14 === line.sku) || db.products_sku[0];
      const recibidas = Math.max(1, parseInt(line.piezas_recibidas) || 20);
      db.inspecciones_calidad.push({
        id_inspeccion: nextInspId++,
        id_recepcion: nextId,
        sku: prod.sku,
        sku_14: prod.sku_14,
        modelo_martela: prod.modelo_martela,
        descripcion: prod.descripcion,
        piezas_recibidas: recibidas,
        piezas_aprobadas: 0,
        piezas_reparacion_interna: 0,
        piezas_merma_fundicion: 0,
        observaciones_tecnicas: 'En conteo en Mesa de Control de Calidad'
      });
    });

    this._saveDB(db);
    await this.audit('REGISTRO_VALIJA_IMPORTACION', 'Recepción Paquetería', newRec.guia_tracking, `${newRec.total_bultos} bultos (${newRec.peso_bruto_paquete_g}g) · Video Evidencia adjunto`);
    return newRec;
  }

  async updateQualitySemaphore(idInspeccion, bucket, delta = 1) {
    await this._simulateNetwork(40);
    const db = this._getDB();
    const row = (db.inspecciones_calidad || []).find(i => i.id_inspeccion === Number(idInspeccion));
    if (!row) throw new Error('Renglón de inspección no encontrado.');

    const fieldMap = {
      APROBADA: 'piezas_aprobadas',
      REPARACION: 'piezas_reparacion_interna',
      MERMA: 'piezas_merma_fundicion'
    };
    const field = fieldMap[bucket];
    if (!field) throw new Error('Clasificación de semáforo inválida.');

    const currentTotalClassified =
      row.piezas_aprobadas + row.piezas_reparacion_interna + row.piezas_merma_fundicion;

    if (delta > 0 && currentTotalClassified + delta > row.piezas_recibidas) {
      throw new Error(`Ya se clasificaron las ${row.piezas_recibidas} piezas recibidas de este modelo.`);
    }

    row[field] = Math.max(0, row[field] + delta);
    this._saveDB(db);
    return row;
  }

  async completeQualityInspection(idRecepcion) {
    await this._simulateNetwork(120);
    const db = this._getDB();
    const rec = (db.recepciones_paqueteria || []).find(r => r.id_recepcion === Number(idRecepcion));
    if (!rec) throw new Error('Recepción no encontrada.');

    const rows = (db.inspecciones_calidad || []).filter(i => i.id_recepcion === rec.id_recepcion);
    let totalRec = 0, totalClas = 0, totalMerma = 0, totalRep = 0, totalAprob = 0;
    rows.forEach(r => {
      totalRec += r.piezas_recibidas;
      const sum = r.piezas_aprobadas + r.piezas_reparacion_interna + r.piezas_merma_fundicion;
      totalClas += sum;
      totalAprob += r.piezas_aprobadas;
      totalRep += r.piezas_reparacion_interna;
      totalMerma += r.piezas_merma_fundicion;
    });

    rec.estatus = totalClas === totalRec && totalMerma === 0 ? 'CONCILIADO' : (totalMerma > 0 || totalClas !== totalRec ? 'CON_DISCREPANCIA' : 'CONCILIADO');
    this._saveDB(db);
    await this.audit(
      'DICTAMEN_MESA_CALIDAD',
      'Control de Calidad',
      rec.folio_recepcion,
      `Aprobadas a Báscula: ${totalAprob} | Taller Reparación: ${totalRep} | Charola Fundición: ${totalMerma}`
    );
    return rec;
  }

  // =========================================================================
  // MÓDULO 3 SDOP: BÁSCULA DIGITAL (4 DECIMALES), SUB-PIEZAS Y GAVETAS
  // =========================================================================
  async getGavetas() {
    await this._simulateNetwork(50);
    return this._getDB().ubicaciones_gavetas || [];
  }

  async weighIndividualSubPiece(payload) {
    await this._simulateNetwork(110);
    const db = this._getDB();
    const prod = db.products_sku.find(p => p.sku === payload.sku || p.sku_14 === payload.sku);
    if (!prod) throw new Error('SKU no encontrado en el Catálogo Maestro.');

    const pesoBruto = +Number(payload.peso_bruto_g || 0).toFixed(4);
    const pesoPiedra = +Number(prod.peso_piedra_cz || 0).toFixed(4);
    if (pesoBruto <= pesoPiedra) {
      throw new Error(`El peso bruto en báscula (${pesoBruto.toFixed(4)}g) debe ser mayor al peso de la circonia (${pesoPiedra.toFixed(4)}g).`);
    }

    const pesoNetoMetal = +(pesoBruto - pesoPiedra).toFixed(4);
    const factorOro = Number(prod.factor_oro_fino ?? 0.41667);
    const gramosOroFino = +(pesoNetoMetal * factorOro).toFixed(5);

    db.counter = (db.counter || 500) + 1;
    const pieceId = `PZ-2026-${String(db.counter).padStart(4, '0')}`;
    const gaveta = payload.ubicacion_gaveta || 'BOVEDA-R1-N1-G01';
    const almacenId = gaveta.startsWith('RACK_PLATA')
      ? 'RACK_PLATA'
      : gaveta.startsWith('DEFECTOS')
      ? 'TALLER_FUNDICION'
      : 'BOVEDA_GENERAL';

    const newPiece = {
      piece_id: pieceId,
      id_pieza: pieceId,
      sku_ref: prod.sku,
      sku_14: prod.sku_14,
      modelo_martela: prod.modelo_martela,
      id_recepcion: payload.id_recepcion || 101,
      ubicacion_gaveta: gaveta,
      peso_bruto_g: pesoBruto,
      peso_piedra_g: pesoPiedra,
      peso_neto_metal_g: pesoNetoMetal,
      peso_neto_g: pesoNetoMetal,
      gramos_oro_fino: gramosOroFino,
      almacen_id: almacenId,
      estatus: 'DISPONIBLE',
      fecha_ingreso: new Date().toISOString().slice(0, 10),
      fecha_pesaje: new Date().toLocaleString('es-MX', { hour12: false }),
      order_id: null,
      box_id: null,
      store_id: null
    };

    db.inventory_pieces.unshift(newPiece);
    this._saveDB(db);
    await this.audit(
      'PESAJE_BASCULA_SUBPIEZA',
      'Báscula Digital',
      pieceId,
      `SKU ${prod.sku_14} · Bruto: ${pesoBruto.toFixed(4)}g - CZ: ${pesoPiedra.toFixed(4)}g = Neto: ${pesoNetoMetal.toFixed(4)}g (${gramosOroFino.toFixed(5)}g Au Fino) -> ${gaveta}`
    );
    return newPiece;
  }

  // =========================================================================
  // MÓDULO 4 SDOP: MOTOR FINANCIERO FIX Y LIQUIDACIÓN BIPARTITA
  // =========================================================================
  async calculateBipartiteQuote(params = {}) {
    await this._simulateNetwork(60);
    const db = this._getDB();
    const r = db.metal_rates;

    // 1. Regla de Tarifa Máxima Fix (Hoy vs Ayer)
    const fixAplicadoUsd = Math.max(Number(r.fix_oro_hoy_usd), Number(r.fix_oro_ayer_usd));
    const tc = Number(r.tipo_cambio_usd_mxn || 19.5);
    const gramoOroFino24kMxn = (fixAplicadoUsd * tc) / 31.1035;

    const metalTipo = params.metal_tipo || 'ORO_14K';
    const pesoBrutoG = +Number(params.peso_bruto_g || 5.25).toFixed(4);
    const pesoPiedraCzG = +Number(params.peso_piedra_cz || 0).toFixed(4);
    const pesoNetoMetalG = +Math.max(0.01, pesoBrutoG - pesoPiedraCzG).toFixed(4);
    const costoMoPorGramo = +Number(params.costo_mo_gramo || 65.0).toFixed(2);

    let factorOroFino = 0.58333;
    let costoGramoMetalDia = 0;

    if (metalTipo === 'PLATA_925' || metalTipo === 'PLATA') {
      factorOroFino = 0.00000;
      costoGramoMetalDia = Number(r.costo_gramo_plata_mxn || 24.80);
    } else if (metalTipo === 'ORO_10K' || metalTipo === '10K') {
      factorOroFino = 0.41667;
      costoGramoMetalDia = +(gramoOroFino24kMxn * factorOroFino).toFixed(2);
    } else if (metalTipo === 'ORO_18K' || metalTipo === '18K') {
      factorOroFino = 0.75000;
      costoGramoMetalDia = +(gramoOroFino24kMxn * factorOroFino).toFixed(2);
    } else {
      factorOroFino = 0.58333;
      costoGramoMetalDia = +(gramoOroFino24kMxn * factorOroFino).toFixed(2);
    }

    // 2. Facturación Bipartita: Renglón 1 (M.O. por gramo) + Renglón 2 (Metal por gramo)
    const importeManoObra = +(pesoNetoMetalG * costoMoPorGramo).toFixed(2);
    const importeMetal = +(pesoNetoMetalG * costoGramoMetalDia).toFixed(2);
    const subtotalMartela = +(importeManoObra + importeMetal).toFixed(2);

    // 3. Margen Comercial Cliente (70%) + IVA (16%)
    const margenPct = Number(r.margen_comercial_mls ?? 0.70);
    const utilidadCliente70 = +(subtotalMartela * margenPct).toFixed(2);
    const precioAntesIva = +(subtotalMartela + utilidadCliente70).toFixed(2);
    const iva16 = +(precioAntesIva * 0.16).toFixed(2);
    const precioPublicoConIva = +(precioAntesIva + iva16).toFixed(2);

    // 4. Gramos Oro Fino Puro a debitar de Cuenta Maquila (Montepío)
    const gramosOroFinoDebitar = +(pesoNetoMetalG * factorOroFino).toFixed(5);

    return {
      fix_hoy_usd: r.fix_oro_hoy_usd,
      fix_ayer_usd: r.fix_oro_ayer_usd,
      fix_aplicado_usd: fixAplicadoUsd,
      regla_tarifa_maxima: r.fix_oro_ayer_usd >= r.fix_oro_hoy_usd ? 'FIX AYER (TARIFA MÁXIMA APLICADA)' : 'FIX HOY (TARIFA MÁXIMA APLICADA)',
      tipo_cambio_usd_mxn: tc,
      gramo_oro_fino_24k_mxn: +gramoOroFino24kMxn.toFixed(2),
      costo_gramo_10k_mxn: +(gramoOroFino24kMxn * 0.41667).toFixed(2),
      costo_gramo_14k_mxn: +(gramoOroFino24kMxn * 0.58333).toFixed(2),
      costo_gramo_plata_mxn: Number(r.costo_gramo_plata_mxn || 24.80),
      metal_tipo: metalTipo,
      factor_oro_fino: factorOroFino,
      peso_bruto_g: pesoBrutoG,
      peso_piedra_cz_g: pesoPiedraCzG,
      peso_neto_metal_g: pesoNetoMetalG,
      costo_mo_por_gramo: costoMoPorGramo,
      costo_metal_por_gramo: costoGramoMetalDia,
      importe_mano_obra: importeManoObra,
      importe_metal: importeMetal,
      subtotal_martela: subtotalMartela,
      utilidad_cliente_70: utilidadCliente70,
      iva_16: iva16,
      precio_publico_con_iva: precioPublicoConIva,
      gramos_oro_fino_debitar: gramosOroFinoDebitar
    };
  }

  async registerMaquilaGoldMovement(payload) {
    await this._simulateNetwork(110);
    const db = this._getDB();
    const client = db.clients.find(c => c.id === 'CLI-004') || db.clients[0];
    const gramos = +Number(payload.gramos_oro_fino || 0).toFixed(5);
    const tipo = payload.tipo_movimiento || 'DEPOSITO_ORO_FINO';

    if (tipo === 'DEBITO_LIQUIDACION') {
      client.saldo_oro_fino_g = +Math.max(0, (client.saldo_oro_fino_g || 0) - gramos).toFixed(5);
    } else {
      client.saldo_oro_fino_g = +((client.saldo_oro_fino_g || 0) + gramos).toFixed(5);
    }

    const entry = {
      id: `MAQ-2026-${String((db.maquila_compensations?.length || 0) + 2).padStart(3, '0')}`,
      cliente: client.nombre,
      fecha: new Date().toISOString().slice(0, 10),
      tipo_movimiento: tipo,
      gramos_oro_fino: gramos,
      ley: '24K (99.9%)',
      folio_acta: payload.folio_acta || `ACTA-ORO-${Date.now().toString().slice(-4)}`,
      saldo_restante_g: client.saldo_oro_fino_g,
      notas: payload.notas || 'Movimiento en cuenta corriente de Oro Fino Puro'
    };

    db.maquila_compensations.unshift(entry);
    this._saveDB(db);
    await this.audit('MOVIMIENTO_CUENTA_MAQUILA_ORO', 'Motor Financiero Fix', entry.id, `${tipo}: ${gramos.toFixed(5)}g Au 24K · Saldo: ${client.saldo_oro_fino_g.toFixed(5)}g`);
    return entry;
  }

  // =========================================================================
  // MÓDULO 5 SDOP: SALIDAS B2B, LAYOUT EXCEL 16 COLUMNAS Y REMISIÓN CON SELLO
  // =========================================================================
  async updateBranchRemisionSeal(orderId, tiendaId, sealData) {
    await this._simulateNetwork(90);
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId) || db.coppel_orders[0];
    const branch = order?.sucursales.find(s => s.tienda_id === tiendaId);
    if (!branch) throw new Error('Sucursal / Centro Logístico no encontrado.');

    if (sealData.sello_seguridad_bolsa) branch.sello_seguridad_bolsa = sealData.sello_seguridad_bolsa.trim().toUpperCase();
    if (sealData.factura_sae) branch.factura_sae = sealData.factura_sae.trim().toUpperCase();
    if (sealData.peso_bolsa_verificado_g !== undefined) {
      branch.peso_bolsa_verificado_g = +Number(sealData.peso_bolsa_verificado_g).toFixed(2);
    }

    this._saveDB(db);
    await this.audit('SELLO_BOLSA_REMISION_B2B', 'Despiece B2B', branch.tienda_id, `Sello: ${branch.sello_seguridad_bolsa} · Factura SAE: ${branch.factura_sae}`);
    return branch;
  }

  // =========================================================================
  // SUBMÓDULO MONTEPÍO LUZ SAVIÑÓN (MLS): REMISIONES, LAYOUT 16 COLS & MAQUILA
  // =========================================================================
  async getMlsRemisiones() {
    await this._simulateNetwork(40);
    const db = this._getDB();
    if (!db.salidas_remisiones_mls) {
      db.salidas_remisiones_mls = [
        {
          id_remision: "REM-MLS-2026-3032",
          folio_remision: "REM-MLS-2026-3032",
          centro_logistico_id: "3032",
          centro_nombre: "3032 Cancún Boutique",
          tipo_metal: "ORO_10K",
          factura_sae: "SAE-F-90812",
          folio_sello_seguridad: "Z008340",
          peso_bruto_con_bolsa_g: 1149.00,
          total_piezas: 17,
          total_peso_neto_oro_g: 37.4000,
          total_oro_fino_g: 15.58345,
          total_costo_martela: 38450.00,
          total_margen_mls: 26915.00,
          total_publico_con_iva: 75823.40,
          estatus: "PREPARADO",
          fecha_emision: new Date().toISOString()
        },
        {
          id_remision: "REM-MLS-2026-3050",
          folio_remision: "REM-MLS-2026-3050",
          centro_logistico_id: "3050",
          centro_nombre: "3050 Santa Fe Avant",
          tipo_metal: "PLATA_925",
          factura_sae: "SAE-F-90813",
          folio_sello_seguridad: "Z008341",
          peso_bruto_con_bolsa_g: 890.50,
          total_piezas: 17,
          total_peso_neto_oro_g: 42.1000,
          total_oro_fino_g: 0.00000,
          total_costo_martela: 18200.00,
          total_margen_mls: 12740.00,
          total_publico_con_iva: 35890.40,
          estatus: "EN_RUTA",
          fecha_emision: new Date().toISOString()
        }
      ];
      this._saveDB(db);
    }
    return db.salidas_remisiones_mls;
  }

  async createMlsRemision(data) {
    await this._simulateNetwork(180);
    const db = this._getDB();
    if (!db.salidas_remisiones_mls) db.salidas_remisiones_mls = [];

    const newRemision = {
      id_remision: data.folio_remision || `REM-MLS-2026-${data.centro_logistico_id || '3032'}`,
      folio_remision: data.folio_remision || `REM-MLS-2026-${data.centro_logistico_id || '3032'}`,
      centro_logistico_id: data.centro_logistico_id || '3032',
      centro_nombre: data.centro_nombre || 'Centro Logístico MLS',
      tipo_metal: data.tipo_metal || 'ORO_10K',
      factura_sae: data.factura_sae || 'SAE-F-90812',
      folio_sello_seguridad: data.folio_sello_seguridad || 'Z008340',
      peso_bruto_con_bolsa_g: +Number(data.peso_bruto_con_bolsa_g || 1149.0).toFixed(2),
      total_piezas: data.piezas_ids?.length || 17,
      total_peso_neto_oro_g: +Number(data.total_peso_neto_oro_g || 37.4).toFixed(4),
      total_oro_fino_g: +Number(data.total_oro_fino_g || 15.58345).toFixed(5),
      total_costo_martela: +Number(data.total_costo_martela || 38450).toFixed(2),
      total_margen_mls: +Number(data.total_margen_mls || 26915).toFixed(2),
      total_publico_con_iva: +Number(data.total_publico_con_iva || 75823.4).toFixed(2),
      piezas_ids: data.piezas_ids || [],
      estatus: "PREPARADO",
      fecha_emision: new Date().toISOString()
    };

    // Descontar inventario físico de las piezas seleccionadas
    (data.piezas_ids || []).forEach(pId => {
      const piece = db.inventory_pieces.find(p => p.piece_id === pId);
      if (piece) {
        piece.estatus = 'ASIGNADO_SALIDA';
        piece.remision_mls = newRemision.folio_remision;
      }
    });

    // Si es Oro: Débito de Oro Fino Puro 24K en Cuenta Maquila Montepío
    if (data.tipo_metal !== 'PLATA_925' && newRemision.total_oro_fino_g > 0) {
      const client = db.clients.find(c => c.id === 'CLI-004' || c.nombre.includes('Montepío')) || db.clients[0];
      client.saldo_oro_fino_g = +Math.max(0, (client.saldo_oro_fino_g || 145.8) - newRemision.total_oro_fino_g).toFixed(5);
      
      db.maquila_compensations.unshift({
        id: `MAQ-2026-${String((db.maquila_compensations?.length || 0) + 1).padStart(3, '0')}`,
        cliente: "Montepío Luz Saviñón / Clientes Maquila",
        fecha: new Date().toISOString().slice(0, 10),
        tipo_movimiento: "DEBITO_LIQUIDACION",
        gramos_oro_fino: newRemision.total_oro_fino_g,
        ley: "24K (99.9%)",
        folio_acta: `ACTA-REM-${newRemision.centro_logistico_id}`,
        saldo_restante_g: client.saldo_oro_fino_g,
        notas: `Débito automático por remisión ${newRemision.folio_remision} a sucursal ${newRemision.centro_nombre}`
      });
    }

    db.salidas_remisiones_mls.unshift(newRemision);
    this._saveDB(db);
    await this.audit('CREACION_REMISION_MLS', 'Montepío B2B', newRemision.folio_remision, `${newRemision.total_piezas} piezas asignadas a ${newRemision.centro_nombre} · Sello: ${newRemision.folio_sello_seguridad}`);
    return newRemision;
  }

  // =========================================================================
  // SUBMÓDULO MAYORISTAS & BOUTIQUES INDEPENDIENTES (VENTA LIBRE POR SKU)
  // =========================================================================
  async getWholesaleOrders() {
    await this._simulateNetwork(40);
    const db = this._getDB();
    if (!db.wholesale_orders) {
      db.wholesale_orders = [
        {
          id: "MAY-2026-001",
          folio: "MAY-2026-001",
          cliente_id: "CLI-002",
          cliente_nombre: "Joyas del Centro Mayoristas",
          rfc: "JCE850201BB2",
          fecha: new Date().toISOString(),
          partidas: [
            { sku: "07502278209688", descripcion: "Anillo Solitario Imperial CZ Oro 10K", cantidad: 6, peso_unit_g: 2.20, costo_unit: 1485.00, margen_pct: 30, precio_unit: 1930.50, subtotal: 11583.00 },
            { sku: "07502278209695", descripcion: "Broquel Bola Lisa Oro 10K", cantidad: 10, peso_unit_g: 0.95, costo_unit: 680.00, margen_pct: 30, precio_unit: 884.00, subtotal: 8840.00 }
          ],
          total_piezas: 16,
          subtotal: 20423.00,
          iva_16: 3267.68,
          total: 23690.68,
          estatus: "SURTIDO_LISTO",
          factura_sae: "SAE-F-90825"
        }
      ];
      this._saveDB(db);
    }
    return db.wholesale_orders;
  }

  async createWholesaleOrder(orderData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    if (!db.wholesale_orders) db.wholesale_orders = [];

    const newOrder = {
      id: `MAY-2026-${String(db.wholesale_orders.length + 1).padStart(3, '0')}`,
      folio: `MAY-2026-${String(db.wholesale_orders.length + 1).padStart(3, '0')}`,
      cliente_id: orderData.cliente_id || 'CLI-002',
      cliente_nombre: orderData.cliente_nombre || 'Mayorista General',
      rfc: orderData.rfc || 'XAXX010101000',
      fecha: new Date().toISOString(),
      partidas: orderData.partidas || [],
      total_piezas: orderData.total_piezas || 1,
      subtotal: +Number(orderData.subtotal || 0).toFixed(2),
      iva_16: +Number(orderData.iva_16 || 0).toFixed(2),
      total: +Number(orderData.total || 0).toFixed(2),
      estatus: "SURTIDO_LISTO",
      factura_sae: orderData.factura_sae || `SAE-F-${Math.floor(90800 + Math.random() * 99)}`
    };

    // Descontar inventario disponible de bóveda si hay piezas
    let descontadas = 0;
    (orderData.partidas || []).forEach(item => {
      const piezas = db.inventory_pieces.filter(p => p.sku_ref === item.sku && p.estatus === 'DISPONIBLE').slice(0, item.cantidad);
      piezas.forEach(p => {
        p.estatus = 'ASIGNADO_SALIDA';
        p.order_id = newOrder.folio;
        descontadas++;
      });
    });

    db.wholesale_orders.unshift(newOrder);
    this._saveDB(db);
    await this.audit('PEDIDO_MAYORISTA_CREADO', 'Ventas B2B', newOrder.folio, `${newOrder.cliente_nombre} · ${newOrder.total_piezas} piezas · Total: $${newOrder.total}`);
    return newOrder;
  }

  async generateOfficial16ColExcelRows(orderId, tiendaIdFilter = '') {
    const db = this._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId) || db.coppel_orders[0];
    const rates = await this.getMetalRates();
    const gramoFino24k = rates.precio_gramo_fino_mxn;

    const branches = tiendaIdFilter
      ? order.sucursales.filter(s => s.tienda_id === tiendaIdFilter)
      : order.sucursales;

    const rows = [];
    let consecutivo = 1;

    branches.forEach(suc => {
      const pieces = db.inventory_pieces.filter(p => suc.piezas_asignadas_ids.includes(p.piece_id));
      const listToUse = pieces.length > 0 ? pieces : db.inventory_pieces.slice(0, Math.min(5, suc.piezas_solicitadas));

      listToUse.forEach(p => {
        const prod = db.products_sku.find(x => x.sku === p.sku_ref) || db.products_sku[0];
        const pesoBruto = +Number(p.peso_bruto_g || 2.0).toFixed(4);
        const pesoPiedra = +Number(p.peso_piedra_g ?? prod.peso_piedra_cz ?? 0).toFixed(4);
        const pesoNeto = +Math.max(0.1, pesoBruto - pesoPiedra).toFixed(4);
        const factor = Number(prod.factor_oro_fino ?? 0.41667);
        const oroFinoPuro = +(pesoNeto * factor).toFixed(5);

        const costoGramoMetal = prod.metal_tipo === 'PLATA_925'
          ? Number(db.metal_rates.costo_gramo_plata_mxn || 24.80)
          : +(gramoFino24k * factor).toFixed(2);

        const costoMo = +(prod.costo_mo_base || 185.00).toFixed(2);
        const costoMetal = +(pesoNeto * costoGramoMetal).toFixed(2);
        const totalMartela = +(costoMo + costoMetal).toFixed(2);
        const margenMls70 = +(totalMartela * 0.70).toFixed(2);
        const costoPublicoIva = +((totalMartela + margenMls70) * 1.16).toFixed(2);

        rows.push({
          '#': consecutivo++,
          'Centro Logístico': `${suc.numero_sucursal || suc.tienda_id} - ${suc.nombre}`,
          'Modelo Martela': prod.modelo_martela || prod.sku,
          'Código de Barras SKU': prod.sku_14 || prod.sku,
          'Descripción': `${prod.descripcion} [Serial: ${p.piece_id}]`,
          'Kilataje': prod.quilataje,
          'Cantidad': 1,
          'Peso Bruto': pesoBruto,
          'Peso Neto Oro': pesoNeto,
          'Costo M.O.': costoMo,
          'Costo Metal': costoMetal,
          'Total Martela': totalMartela,
          'Margen MLS (70%)': margenMls70,
          'Costo Público con IVA': costoPublicoIva,
          'Oro Fino Puro': oroFinoPuro,
          'Factura SAE': suc.factura_sae || order.factura_sae || 'SAE-F-90812'
        });
      });
    });

    return rows;
  }

  // =========================================================================
  // MÓDULO 6 SDOP: LOGÍSTICA PWA OFFLINE-FIRST Y EXPEDIENTE PLD
  // =========================================================================
  async confirmPldDeliveryStop(routeId, paradaId, deliveryData, isOfflineMode = false) {
    await this._simulateNetwork(140);
    const db = this._getDB();
    const route = db.routes.find(r => r.id === routeId);
    if (!route) throw new Error('Ruta no encontrada.');
    const stop = route.paradas.find(p => p.parada_id === paradaId);
    if (!stop) throw new Error('Parada no encontrada.');

    const selloIngresado = String(deliveryData.sello_verificado || stop.sello_seguridad_bolsa || '').trim().toUpperCase();
    if (stop.sello_seguridad_bolsa && selloIngresado !== stop.sello_seguridad_bolsa) {
      throw new Error(`Alerta de Seguridad PLD: El sello ingresado (${selloIngresado}) NO coincide con el Folio de Sello de la Remisión (${stop.sello_seguridad_bolsa}).`);
    }

    stop.estatus = 'ENTREGADA';
    stop.sello_validado = true;
    stop.hora_llegada = stop.hora_llegada || new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    stop.hora_salida = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    stop.receptor_nombre = deliveryData.receptor_nombre;
    stop.firma_canvas_data = deliveryData.firma_canvas_data;
    stop.evidencia_sello_url = deliveryData.evidencia_sello_url;
    stop.latitud = Number(deliveryData.latitud || stop.latitud || 19.432608);
    stop.longitud = Number(deliveryData.longitud || stop.longitud || -99.133209);
    stop.observaciones = deliveryData.observaciones || stop.observaciones;

    const pldRecord = {
      id_evidencia: (db.pld_evidencias_entrega?.length || 0) + 1,
      folio_expediente: stop.expediente_pld_folio || `PLD-EXP-2026-${Date.now().toString().slice(-4)}`,
      id_remision: stop.id_remision || `REM-${stop.parada_id}`,
      sucursal: stop.sucursal,
      sello_seguridad_bolsa: stop.sello_seguridad_bolsa,
      auditor_entrega: 'Adriana López (Oficial de Cumplimiento PLD)',
      chofer: route.chofer,
      receptor_nombre: stop.receptor_nombre,
      firma_digital_base64: stop.firma_canvas_data,
      foto_comprobante_url: stop.evidencia_sello_url,
      latitud: stop.latitud,
      longitud: stop.longitud,
      fecha_hora: new Date().toISOString().slice(0, 19).replace('T', ' '),
      estatus_auditoria: isOfflineMode ? 'EN_COLA_OFFLINE' : 'VALIDADO_INMUTABLE'
    };

    if (!db.pld_evidencias_entrega) db.pld_evidencias_entrega = [];
    db.pld_evidencias_entrega.unshift(pldRecord);

    if (isOfflineMode) {
      if (!db.pwa_offline_queue) db.pwa_offline_queue = [];
      db.pwa_offline_queue.push(pldRecord);
    }

    if (route.paradas.every(p => p.estatus === 'ENTREGADA')) {
      route.estatus = 'COMPLETADA';
    }

    this._saveDB(db);
    await this.audit(
      isOfflineMode ? 'ENTREGA_PWA_OFFLINE_QUEUE' : 'SELLADO_EXPEDIENTE_PLD',
      'Logística PWA / PLD',
      pldRecord.folio_expediente,
      `Sucursal: ${stop.sucursal} · Sello ${stop.sello_seguridad_bolsa} OK · GPS (${stop.latitud.toFixed(5)}, ${stop.longitud.toFixed(5)})`
    );
    return pldRecord;
  }

  async syncOfflinePwaQueue() {
    await this._simulateNetwork(200);
    const db = this._getDB();
    const count = (db.pwa_offline_queue || []).length;
    (db.pld_evidencias_entrega || []).forEach(e => {
      if (e.estatus_auditoria === 'EN_COLA_OFFLINE') {
        e.estatus_auditoria = 'VALIDADO_INMUTABLE';
      }
    });
    db.pwa_offline_queue = [];
    this._saveDB(db);
    if (count > 0) {
      await this.audit('SINCRONIZACION_PWA_ONLINE', 'Logística PWA', `SYNC-${count}`, `${count} expedientes PLD sincronizados con servidor central`);
    }
    return count;
  }

  // =========================================================================
  // MÓDULO: COMPRAS INTERNACIONALES, CICLO DE OC Y AUDITORÍA DE PACKING LIST
  // =========================================================================

  async resetPurchasesDemoData() {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const seed = window.MartelaSeed ? window.MartelaSeed.getInitialData() : {};
    db.ordenes_compra = seed.ordenes_compra || [];
    db.orden_compra_lineas = seed.orden_compra_lineas || [];
    db.compras_logistica_importacion = seed.compras_logistica_importacion || [];
    db.proveedor_estado_cuenta = seed.proveedor_estado_cuenta || [];
    this._saveDB(db);
    return true;
  }

  async getPurchaseOrders(filterStatus = '') {
    await this._simulateNetwork(100);
    const db = this._getDB();
    let orders = [...(db.ordenes_compra || [])];
    if (filterStatus) {
      orders = orders.filter(o => o.estatus === filterStatus);
    }
    return orders.map(o => {
      const prov = (db.proveedores || []).find(p => p.id === o.id_proveedor) || {};
      const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === o.id_oc);
      const totalPiezas = lines.reduce((s, l) => s + (l.cantidad_piezas || 0), 0);
      return {
        ...o,
        proveedor_nombre: o.proveedor_nombre || prov.razon_social || `Proveedor #${o.id_proveedor}`,
        pais_origen: o.pais_origen || prov.pais_origen || 'INTERNACIONAL',
        total_lineas: lines.length,
        total_piezas: totalPiezas
      };
    });
  }

  async getPurchaseOrderById(idOc) {
    await this._simulateNetwork(80);
    const db = this._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === Number(idOc) || o.folio_oc === idOc);
    if (!order) throw new Error(`Orden de Compra ${idOc} no encontrada`);

    const prov = (db.proveedores || []).find(p => p.id === order.id_proveedor) || {};
    const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === order.id_oc);
    const logistica = (db.compras_logistica_importacion || []).find(l => l.id_oc === order.id_oc) || null;
    const movimientos = (db.proveedor_estado_cuenta || []).filter(m => m.id_oc === order.id_oc);

    return {
      ...order,
      proveedor: prov,
      lineas: lines,
      logistica: logistica,
      movimientos: movimientos
    };
  }

  async createPurchaseOrder(ocData) {
    await this._simulateNetwork(200);
    const db = this._getDB();
    if (!db.ordenes_compra) db.ordenes_compra = [];
    if (!db.orden_compra_lineas) db.orden_compra_lineas = [];

    const prov = (db.proveedores || []).find(p => p.id === Number(ocData.id_proveedor));
    if (!prov) throw new Error(`Proveedor ${ocData.id_proveedor} no válido`);

    const nextId = db.ordenes_compra.length + 1;
    const folio = ocData.folio_oc || `OC-MARTELA-2026-${String(nextId).padStart(4, '0')}`;

    let totalGramosTeoricos = 0;
    let totalMoEstimada = 0;
    const processedLines = [];

    const rawLines = Array.isArray(ocData.lineas) ? ocData.lineas : [];
    if (rawLines.length === 0) {
      throw new Error("La orden de compra debe incluir al menos una línea de producto");
    }

    rawLines.forEach((item, idx) => {
      const cant = parseInt(item.cantidad_piezas, 10) || 1;
      const pesoUnit = parseFloat(item.peso_teorico_unitario_g) || 1.0;
      const moUnit = parseFloat(item.costo_mo_unitario) || 10.0;
      const pesoTotalLinea = +(cant * pesoUnit).toFixed(4);
      const moTotalLinea = +(cant * moUnit).toFixed(2);

      totalGramosTeoricos += pesoTotalLinea;
      totalMoEstimada += moTotalLinea;

      // REGLA 3: Alta Anticipada en Catálogo Maestro si es modelo nuevo
      let skuRef = item.sku;
      if (!skuRef || skuRef.trim() === '') {
        skuRef = `0750${Date.now().toString().slice(-8)}${idx}`;
      }

      const existingProd = (db.products_sku || []).find(p => (p.sku_14 === skuRef || p.sku === skuRef || p.modelo_proveedor === item.modelo_proveedor));
      if (!existingProd) {
        const factorLey = item.kilataje === '10K' ? 0.41667 : (item.kilataje === '14K' ? 0.58333 : 0.925);
        db.products_sku.push({
          sku: skuRef,
          sku_14: skuRef,
          modelo_martela: item.modelo_martela || `MRT-${item.modelo_proveedor || skuRef}`,
          modelo_proveedor: item.modelo_proveedor || `MOD-${skuRef}`,
          id_proveedor: prov.id,
          proveedor_nombre: prov.razon_social,
          pais_origen: prov.pais_origen,
          descripcion: item.descripcion || `Joya ${item.kilataje || '14K'} ${item.modelo_proveedor || ''}`,
          tipo_alhaja: item.tipo_alhaja || 'JOYERIA_FINA',
          categoria: 'Compras Internacionales',
          metal_tipo: item.kilataje === '10K' ? 'ORO_10K' : (item.kilataje === '14K' ? 'ORO_14K' : 'PLATA_925'),
          tipo_metal: 'ORO_AMARILLO',
          quilataje: item.kilataje || '14K',
          medida: item.medida || 'Estándar',
          costo_mo_base: moUnit,
          costo_hechura_base: moUnit,
          peso_teorico_g: pesoUnit,
          peso_piedra_cz: parseFloat(item.peso_piedra_cz || 0),
          factor_oro_fino: factorLey,
          estatus: 'PRE_REGISTRO_COMPRA',
          activo: true
        });
      }

      const lineObj = {
        id_linea: db.orden_compra_lineas.length + idx + 1,
        id_oc: nextId,
        sku: skuRef,
        modelo_proveedor: item.modelo_proveedor || skuRef,
        descripcion: item.descripcion || (existingProd ? existingProd.descripcion : `Modelo ${item.modelo_proveedor}`),
        kilataje: item.kilataje || '14K',
        cantidad_piezas: cant,
        peso_teorico_unitario_g: pesoUnit,
        peso_teorico_total_g: pesoTotalLinea,
        costo_mo_unitario: moUnit,
        costo_mo_total: moTotalLinea,
        peso_packing_unitario_g: 0.0000,
        peso_packing_total_g: 0.0000,
        variacion_peso_porcentaje: 0.00,
        estatus_tolerancia: 'PENDIENTE'
      };
      processedLines.push(lineObj);
      db.orden_compra_lineas.push(lineObj);
    });

    const newOrder = {
      id_oc: nextId,
      folio_oc: folio,
      id_proveedor: prov.id,
      proveedor_nombre: prov.razon_social,
      pais_origen: prov.pais_origen,
      moneda: prov.moneda_defecto || prov.moneda_compra || 'USD',
      estatus: ocData.estatus || 'BORRADOR',
      peso_oro_teorico_total_g: +totalGramosTeoricos.toFixed(4),
      costo_mo_total_estimado: +totalMoEstimada.toFixed(2),
      fix_oro_cerrado_usd: null,
      tipo_cambio_cerrado: null,
      importe_metal_total: 0,
      importe_total_liquidable: +totalMoEstimada.toFixed(2),
      fecha_emision: new Date().toLocaleString('es-MX', { hour12: false }),
      fecha_promesa_entrega: ocData.fecha_promesa_entrega || '',
      notas: ocData.notas || ''
    };

    db.ordenes_compra.unshift(newOrder);
    this._saveDB(db);

    await this.audit(
      'CREACION_ORDEN_COMPRA',
      'Compras Internacionales',
      folio,
      `Emitida a ${prov.razon_social} · ${processedLines.length} líneas · ${newOrder.peso_oro_teorico_total_g}g teóricos Au · M.O. $${newOrder.costo_mo_total_estimado} ${newOrder.moneda}`
    );

    return { ...newOrder, lineas: processedLines };
  }

  async auditPackingList(idOc, packingRows) {
    await this._simulateNetwork(180);
    const db = this._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === Number(idOc) || o.folio_oc === idOc);
    if (!order) throw new Error(`Orden ${idOc} no encontrada`);

    const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === order.id_oc);
    if (lines.length === 0) throw new Error("La orden no tiene líneas registradas para auditar");

    let totalPackingGrams = 0;
    let anyExceeded = false;
    const packingMap = new Map();
    (packingRows || []).forEach(r => packingMap.set(r.id_linea, r));

    lines.forEach(line => {
      const packingInfo = packingMap.get(line.id_linea);
      if (packingInfo) {
        const pesoPackingTotal = parseFloat(packingInfo.peso_packing_total_g) || (parseFloat(packingInfo.peso_packing_unitario_g) * line.cantidad_piezas) || line.peso_teorico_total_g;
        const pesoPackingUnit = +(pesoPackingTotal / line.cantidad_piezas).toFixed(4);
        line.peso_packing_unitario_g = pesoPackingUnit;
        line.peso_packing_total_g = +pesoPackingTotal.toFixed(4);

        // Variación: ((peso_packing - peso_teorico) / peso_teorico) * 100
        const varPct = +(((pesoPackingTotal - line.peso_teorico_total_g) / line.peso_teorico_total_g) * 100).toFixed(2);
        line.variacion_peso_porcentaje = varPct;

        // Candado estricto ±5%
        if (varPct > 5.0) {
          line.estatus_tolerancia = 'EXCEDE_TOLERANCIA_MAX';
          anyExceeded = true;
        } else if (varPct < -5.0) {
          line.estatus_tolerancia = 'BAJO_TOLERANCIA_MIN';
          anyExceeded = true;
        } else {
          line.estatus_tolerancia = 'DENTRO_RANGO';
        }
      }
      totalPackingGrams += (line.peso_packing_total_g || line.peso_teorico_total_g);
    });

    order.peso_packing_total_g = +totalPackingGrams.toFixed(4);
    order.variacion_peso_total_pct = +(((totalPackingGrams - order.peso_oro_teorico_total_g) / order.peso_oro_teorico_total_g) * 100).toFixed(2);

    if (anyExceeded) {
      order.estatus = 'PACKING_RECHAZADO';
      order.tolerancia_aprobada = false;
    } else {
      order.estatus = 'PACKING_AUDITADO';
      order.tolerancia_aprobada = true;
    }

    this._saveDB(db);

    await this.audit(
      'AUDITORIA_PACKING_LIST',
      'Compras Internacionales',
      order.folio_oc,
      `Resultado: ${order.estatus} · Variación Global: ${order.variacion_peso_total_pct}% · Peso Real: ${order.peso_packing_total_g}g vs Teórico: ${order.peso_oro_teorico_total_g}g`
    );

    return {
      order,
      lines,
      allValid: !anyExceeded,
      variacionGlobal: order.variacion_peso_total_pct
    };
  }

  async closePurchaseFix(idOc, fixUsd, tipoCambio) {
    await this._simulateNetwork(180);
    const db = this._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === Number(idOc) || o.folio_oc === idOc);
    if (!order) throw new Error(`Orden ${idOc} no encontrada`);

    const fixVal = parseFloat(fixUsd);
    const tcVal = parseFloat(tipoCambio) || 20.00;
    if (!fixVal || fixVal <= 0) throw new Error("Debe ingresar una cotización Fix válida del oro en USD/oz");

    const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === order.id_oc);
    const gramoPuroUsd = fixVal / 31.1035;

    let metalTotalUsd = 0;
    lines.forEach(line => {
      const pesoReal = line.peso_packing_total_g > 0 ? line.peso_packing_total_g : line.peso_teorico_total_g;
      const factorLey = line.kilataje === '10K' ? 0.41667 : (line.kilataje === '14K' ? 0.58333 : 0.925);
      const metalLineaUsd = pesoReal * gramoPuroUsd * factorLey;
      metalTotalUsd += metalLineaUsd;
    });

    order.fix_oro_cerrado_usd = +fixVal.toFixed(2);
    order.tipo_cambio_cerrado = +tcVal.toFixed(4);
    order.importe_metal_total = +metalTotalUsd.toFixed(2);
    order.importe_total_liquidable = +(metalTotalUsd + order.costo_mo_total_estimado).toFixed(2);
    order.importe_total_liquidable_mxn = +(order.importe_total_liquidable * tcVal).toFixed(2);
    order.estatus = 'FIX_CERRADO';
    order.fecha_cierre_fix = new Date().toLocaleString('es-MX', { hour12: false });

    // Registro automático de cargo en el Estado de Cuenta del Proveedor
    if (!db.proveedor_estado_cuenta) db.proveedor_estado_cuenta = [];
    const existingMov = db.proveedor_estado_cuenta.find(m => m.id_oc === order.id_oc && m.tipo_movimiento === 'CARGO_COMPRA');
    if (!existingMov) {
      db.proveedor_estado_cuenta.push({
        id_movimiento: db.proveedor_estado_cuenta.length + 1,
        id_proveedor: order.id_proveedor,
        id_oc: order.id_oc,
        tipo_movimiento: 'CARGO_COMPRA',
        folio_documento: `PI-${order.folio_oc}`,
        monto_divisa: order.importe_total_liquidable,
        moneda: order.moneda || 'USD',
        observaciones: `Cargo por compra cerrada Fix $${fixVal.toFixed(2)} USD/oz (Metal $${order.importe_metal_total} + M.O. $${order.costo_mo_total_estimado})`,
        fecha_registro: new Date().toLocaleString('es-MX', { hour12: false })
      });
    }

    this._saveDB(db);

    await this.audit(
      'CIERRE_FIX_COMPRA',
      'Compras Internacionales',
      order.folio_oc,
      `Fix $${fixVal} USD · TC: $${tcVal} · Total Liquidable: $${order.importe_total_liquidable} ${order.moneda} ($${order.importe_total_liquidable_mxn} MXN)`
    );

    return order;
  }

  async registerPurchasePayment(idOc, paymentData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === Number(idOc) || o.folio_oc === idOc);
    if (!order) throw new Error(`Orden ${idOc} no encontrada`);

    if (!db.proveedor_estado_cuenta) db.proveedor_estado_cuenta = [];
    const monto = Math.abs(parseFloat(paymentData.monto_divisa) || 0);
    if (monto <= 0) throw new Error("El monto del pago debe ser mayor a 0");

    const movType = paymentData.tipo_movimiento || 'ANTICIPO_PAGADO';
    const movement = {
      id_movimiento: db.proveedor_estado_cuenta.length + 1,
      id_proveedor: order.id_proveedor,
      id_oc: order.id_oc,
      tipo_movimiento: movType,
      folio_documento: paymentData.folio_documento || `PAG-${Date.now().toString().slice(-6)}`,
      monto_divisa: -monto,
      moneda: order.moneda || 'USD',
      observaciones: paymentData.observaciones || `${movType === 'ANTICIPO_PAGADO' ? 'Anticipo' : 'Liquidación'} registrado para orden ${order.folio_oc}`,
      fecha_registro: new Date().toLocaleString('es-MX', { hour12: false })
    };

    db.proveedor_estado_cuenta.push(movement);

    if (movType === 'LIQUIDACION_PAGADA') {
      order.estatus = 'PAGADO';
    } else if (order.estatus === 'FIX_CERRADO' || order.estatus === 'PROFORMA_PENDIENTE') {
      order.estatus = 'PRODUCCION_AUTORIZADA';
    }

    this._saveDB(db);

    await this.audit(
      'PAGO_PROVEEDOR_COMPRAS',
      'Compras Internacionales',
      order.folio_oc,
      `${movType}: $${monto} ${order.moneda} · Ref: ${movement.folio_documento}`
    );

    return movement;
  }

  async updatePurchaseLogistics(idOc, logData) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === Number(idOc) || o.folio_oc === idOc);
    if (!order) throw new Error(`Orden ${idOc} no encontrada`);

    if (!db.compras_logistica_importacion) db.compras_logistica_importacion = [];
    let logRecord = db.compras_logistica_importacion.find(l => l.id_oc === order.id_oc);
    if (!logRecord) {
      logRecord = {
        id_logistica: db.compras_logistica_importacion.length + 1,
        id_oc: order.id_oc
      };
      db.compras_logistica_importacion.push(logRecord);
    }

    logRecord.transportista_aerolinea = logData.transportista_aerolinea || 'FedEx Express';
    logRecord.guia_tracking = logData.guia_tracking || `FDX-${Date.now().toString().slice(-10)}`;
    logRecord.agente_aduanal = logData.agente_aduanal || 'Eduardo Mendoza (Agencia Aduanal del Valle)';
    logRecord.costo_flete_divisa = parseFloat(logData.costo_flete_divisa || 0);
    logRecord.impuestos_aduanales_mxn = parseFloat(logData.impuestos_aduanales_mxn || 0);
    logRecord.estatus_transito = logData.estatus_transito || 'EN_VUELO';
    logRecord.fecha_estimada_arribo = logData.fecha_estimada_arribo || '';

    order.estatus = 'EN_TRANSITO';
    order.guia_tracking = logRecord.guia_tracking;
    order.transportista = logRecord.transportista_aerolinea;
    order.agente_aduanal = logRecord.agente_aduanal;

    this._saveDB(db);

    await this.audit(
      'ACTUALIZACION_TRANSITO_ADUANA',
      'Compras Internacionales',
      order.folio_oc,
      `Guía: ${logRecord.guia_tracking} · Transportista: ${logRecord.transportista_aerolinea} · Estatus: ${logRecord.estatus_transito}`
    );

    return logRecord;
  }

  async notifyArrivalToVault(idOc) {
    await this._simulateNetwork(200);
    const db = this._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === Number(idOc) || o.folio_oc === idOc);
    if (!order) throw new Error(`Orden ${idOc} no encontrada`);

    order.estatus = 'ENTREGADO_BOVEDA';

    // ENLACE DIRECTO A MÓDULO 2 (Recepción y Calidad con David Morales)
    if (!db.recepciones_paqueteria) db.recepciones_paqueteria = [];
    const tracking = order.guia_tracking || `FDX-IMP-${order.id_oc}`;
    let rec = db.recepciones_paqueteria.find(r => r.guia_tracking === tracking);
    if (!rec) {
      rec = {
        id_recepcion: db.recepciones_paqueteria.length + 101,
        guia_tracking: tracking,
        id_proveedor: order.id_proveedor,
        proveedor_nombre: order.proveedor_nombre,
        folio_oc_origen: order.folio_oc,
        total_bultos: 1,
        peso_bruto_paquete_g: order.peso_packing_total_g || order.peso_oro_teorico_total_g,
        url_video_evidencia: "https://storage.martela.com.mx/evidence/reception-valija-import.mp4",
        estatus: "PENDIENTE_REVISION",
        observaciones: `Valija internacional arribada de ${order.proveedor_nombre} (Orden ${order.folio_oc}). Enlace automático desde Compras. Listo para desempaque y semáforo de calidad.`,
        fecha_llegada: new Date().toLocaleString('es-MX', { hour12: false })
      };
      db.recepciones_paqueteria.unshift(rec);
    }

    this._saveDB(db);

    await this.audit(
      'NOTIFICACION_ARRIBO_BOVEDA',
      'Compras Internacionales',
      order.folio_oc,
      `Valija vinculada a Módulo 2 con Guía ${tracking} para inspección de David Morales`
    );

    return { order, recepcion: rec };
  }

  async getSupplierStatement(idProveedor) {
    await this._simulateNetwork(120);
    const db = this._getDB();
    const provId = Number(idProveedor);
    const prov = (db.proveedores || []).find(p => p.id === provId);
    if (!prov) throw new Error(`Proveedor ${idProveedor} no encontrado`);

    const movements = (db.proveedor_estado_cuenta || []).filter(m => m.id_proveedor === provId);

    let totalCompras = 0;
    let totalAnticipos = 0;
    let totalLiquidaciones = 0;
    let totalNotasCredito = 0;

    movements.forEach(m => {
      const val = Math.abs(m.monto_divisa || 0);
      if (m.tipo_movimiento === 'CARGO_COMPRA') totalCompras += val;
      else if (m.tipo_movimiento === 'ANTICIPO_PAGADO') totalAnticipos += val;
      else if (m.tipo_movimiento === 'LIQUIDACION_PAGADA') totalLiquidaciones += val;
      else if (m.tipo_movimiento === 'NOTA_CREDITO_DEFECTOS') totalNotasCredito += val;
    });

    const saldoPendiente = +(totalCompras - totalAnticipos - totalLiquidaciones - totalNotasCredito).toFixed(2);

    return {
      proveedor: prov,
      movimientos: movements,
      resumen: {
        total_compras: +totalCompras.toFixed(2),
        total_anticipos: +totalAnticipos.toFixed(2),
        total_liquidaciones: +totalLiquidaciones.toFixed(2),
        total_notas_credito: +totalNotasCredito.toFixed(2),
        saldo_pendiente: saldoPendiente,
        moneda: prov.moneda_defecto || prov.moneda_compra || 'USD'
      }
    };
  }

  async registerQualityCreditNote(idProveedor, monto, motivo, idOc = null) {
    await this._simulateNetwork(150);
    const db = this._getDB();
    const provId = Number(idProveedor);
    const prov = (db.proveedores || []).find(p => p.id === provId);
    if (!prov) throw new Error(`Proveedor ${idProveedor} no encontrado`);

    if (!db.proveedor_estado_cuenta) db.proveedor_estado_cuenta = [];
    const val = Math.abs(parseFloat(monto) || 0);
    if (val <= 0) throw new Error("El monto de la nota de crédito debe ser mayor a 0");

    const nc = {
      id_movimiento: db.proveedor_estado_cuenta.length + 1,
      id_proveedor: provId,
      id_oc: idOc ? Number(idOc) : null,
      tipo_movimiento: 'NOTA_CREDITO_DEFECTOS',
      folio_documento: `NC-PROV-2026-${Date.now().toString().slice(-4)}`,
      monto_divisa: -val,
      moneda: prov.moneda_defecto || prov.moneda_compra || 'USD',
      observaciones: motivo || "Descuento de M.O. por piezas fundidas atribuibles a defecto de fábrica",
      fecha_registro: new Date().toLocaleString('es-MX', { hour12: false })
    };

    db.proveedor_estado_cuenta.push(nc);
    this._saveDB(db);

    await this.audit(
      'NOTA_CREDITO_PROVEEDOR',
      'Compras Internacionales',
      nc.folio_documento,
      `Emitida a ${prov.razon_social} por $${val} ${nc.moneda} · Motivo: ${nc.observaciones}`
    );

    return nc;
  }
}

// Instancia global accesible por la UI
window.apiFacade = new ApiFacade();
