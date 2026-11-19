/**
 * MARTELA — Módulo 0: Compras Internacionales, Ciclo de Órdenes de Compra (OC),
 * Auditoría de Packing List (±5%), Cierre de Fix y Estados de Cuenta
 * Basado en las reglas de negocio de Karina Cruz (Compras) y Eduardo (Aduanas).
 */
window.MartelaPurchases = (function() {
  let activeTab = 'orders'; // 'orders', 'packing', 'fix', 'transit', 'statements'
  let selectedOcId = 3; // Default a Lotus Gold (Packing auditado) o primera disponible
  let selectedSupplierId = 3; // Italoro Arezzo

  // Estado de Paginación Universal
  let ordersPage = 1;
  let ordersPageSize = 20;
  let packingPage = 1;
  let packingPageSize = 20;
  let statementsPage = 1;
  let statementsPageSize = 20;

  // Filtros
  let filterSearch = '';
  let filterStatus = '';

  // Estado temporal de simulación de empaque para auditoría
  let packingSimulatedVariances = {};

  async function render(container) {
    container.innerHTML = `
      <div class="flex items-center justify-center p-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    `;

    const db = window.apiFacade._getDB();
    const orders = await window.apiFacade.getPurchaseOrders(filterStatus);
    const suppliers = db.proveedores || [];
    const user = window.MartelaAuth?.getCurrentUser() || { name: 'Karina Cruz', role: 'Compras' };

    // Si la orden seleccionada no existe, tomar la primera
    if (!orders.some(o => o.id_oc === selectedOcId) && orders.length > 0) {
      selectedOcId = orders[0].id_oc;
    }

    const activeOrder = orders.find(o => o.id_oc === selectedOcId) || orders[0] || null;
    const activeOrderFull = activeOrder ? await window.apiFacade.getPurchaseOrderById(activeOrder.id_oc) : null;

    const { money, grams, esc, badge } = window.MartelaUI;

    // Métricas globales
    const totalOcs = orders.length;
    const totalGramosTeoricos = orders.reduce((s, o) => s + (o.peso_oro_teorico_total_g || 0), 0);
    const ocsEnTransito = orders.filter(o => o.estatus === 'EN_TRANSITO').length;
    const totalMoComprometida = orders.reduce((s, o) => s + (o.costo_mo_total_estimado || 0), 0);

    container.innerHTML = `
      <!-- Encabezado Principal -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">MÓDULO DE COMPRAS</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Compras, Órdenes OC y Cierre de Fix</h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button onclick="MartelaPurchases.openNewOcModal()" class="btn btn-gold flex items-center gap-2 py-2.5 px-4 font-bold shadow-md">
            <span>➕</span> Nueva Orden de Compra (OC)
          </button>
          <button onclick="MartelaPurchases.exportPurchasesExcel()" class="btn btn-soft flex items-center gap-1.5 py-2.5 px-3 text-xs font-semibold">
            <span>⇩</span> Exportar Órdenes (.xlsx)
          </button>
        </div>
      </div>

      <!-- Tarjetas Resumen -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="panel p-4 border-l-4 border-amber-500">
          <div class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Órdenes de Compra</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1.5">${totalOcs} OCs</div>
          <div class="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1">Activas en ciclo</div>
        </div>

        <div class="panel p-4 border-l-4 border-purple-500">
          <div class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Oro Fino Teórico Contratado</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1.5">${grams(totalGramosTeoricos)}</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Total en gramos de metal</div>
        </div>

        <div class="panel p-4 border-l-4 border-emerald-500">
          <div class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">M.O. Total Estimada</div>
          <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1.5">$${totalMoComprometida.toLocaleString('es-MX', { minimumFractionDigits: 2 })} USD</div>
          <div class="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">Mano de obra pactada</div>
        </div>

        <div class="panel p-4 border-l-4 border-blue-500">
          <div class="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider">Valijas en Vuelo / Aduana</div>
          <div class="text-2xl font-black text-blue-500 mt-1.5">${ocsEnTransito} en tránsito</div>
          <div class="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">Rastreo con Eduardo (Aduanas)</div>
        </div>
      </div>

      <!-- Pipeline Visual Stepper de 7 Fases para la Orden Seleccionada -->
      ${renderLifecycleStepper(activeOrder)}

      <!-- Barra de Pestañas Operativas -->
      <div class="border-b border-slate-200 dark:border-slate-800 mb-6">
        <div class="flex overflow-x-auto gap-2">
          <button 
            onclick="MartelaPurchases.switchTab('orders')" 
            class="px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'orders' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700'}"
          >
            📋 1. Gestor de Órdenes de Compra (OC)
          </button>
          <button 
            onclick="MartelaPurchases.switchTab('packing')" 
            class="px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'packing' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700'}"
          >
            ⚖️ 2. Mesa de Auditoría de Packing List (±5%)
          </button>
          <button 
            onclick="MartelaPurchases.switchTab('fix')" 
            class="px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'fix' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700'}"
          >
            📈 3. Cierre de Fix Internacional &amp; Liquidación
          </button>
          <button 
            onclick="MartelaPurchases.switchTab('transit')" 
            class="px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'transit' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700'}"
          >
            ✈️ 4. Tracking Aduanal &amp; Enlace a Bóveda
          </button>
          <button 
            onclick="MartelaPurchases.switchTab('statements')" 
            class="px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === 'statements' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-700'}"
          >
            🏛️ 5. Estado de Cuenta &amp; Notas de Crédito
          </button>
        </div>
      </div>

      <!-- Contenedor Dinámico de la Pestaña Activa -->
      <div id="purchasesTabContent">
        ${renderCurrentTabContent(activeTab, orders, activeOrderFull, suppliers, user)}
      </div>
    `;
  }

  // =========================================================================
  // PIPELINE STEPPER: 7 FASES DOCUMENTALES
  // =========================================================================
  function renderLifecycleStepper(order) {
    if (!order) return '';
    const stages = [
      { key: 'BORRADOR', num: '1', title: 'Borrador OC', desc: 'Pesos teóricos' },
      { key: 'PROFORMA_PENDIENTE', num: '2', title: 'Proforma Ok', desc: 'Autorización' },
      { key: 'PACKING_AUDITADO', num: '3', title: 'Packing (±5%)', desc: 'Candado auditado' },
      { key: 'FIX_CERRADO', num: '4', title: 'Cierre Fix', desc: 'Metal congelado' },
      { key: 'PAGADO', num: '5', title: 'Pago / Anticipo', desc: 'Póliza contable' },
      { key: 'EN_TRANSITO', num: '6', title: 'En Tránsito', desc: 'Vuelo & Aduana' },
      { key: 'ENTREGADO_BOVEDA', num: '7', title: 'Arribo a Bóveda', desc: 'Enlace Módulo 2' }
    ];

    const stageHierarchy = {
      'BORRADOR': 1,
      'PROFORMA_PENDIENTE': 2,
      'PRODUCCION_AUTORIZADA': 2,
      'PACKING_RECHAZADO': 2,
      'PACKING_AUDITADO': 3,
      'FIX_CERRADO': 4,
      'PAGADO': 5,
      'EN_TRANSITO': 6,
      'ENTREGADO_BOVEDA': 7
    };

    const currentLevel = stageHierarchy[order.estatus] || 1;

    return `
      <div class="panel p-4 mb-6 bg-slate-900 text-white rounded-2xl shadow-lg border border-slate-800">
        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center gap-2">
            <span class="text-xs uppercase tracking-wider text-amber-400 font-bold">Ciclo Documental Activo:</span>
            <span class="font-mono font-bold text-sm text-white">${order.folio_oc}</span>
            <span class="text-xs text-slate-400">(${order.proveedor_nombre})</span>
          </div>
          <div>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold ${order.estatus === 'PACKING_RECHAZADO' ? 'bg-rose-500 text-white animate-pulse' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}">
              ${order.estatus}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          ${stages.map((st, idx) => {
            const stepNum = idx + 1;
            const isDone = stepNum < currentLevel;
            const isCurrent = stepNum === currentLevel;
            const isPending = stepNum > currentLevel;

            let badgeBg = 'bg-slate-800 text-slate-400 border-slate-700';
            if (isDone) badgeBg = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
            if (isCurrent) badgeBg = 'bg-amber-500 text-slate-900 font-black border-amber-400 ring-2 ring-amber-500/30';

            return `
              <div class="p-3 rounded-xl border ${badgeBg} flex flex-col justify-between text-xs transition-all shadow-sm">
                <div class="flex items-center justify-between">
                  <span class="font-mono font-bold text-xs opacity-75">${st.num}</span>
                  <span class="text-sm font-bold">${isDone ? '✓' : (isCurrent ? '●' : '○')}</span>
                </div>
                <div class="font-bold text-xs mt-1.5 leading-tight">${st.title}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // ROUTER DE SUB-VISTAS
  // =========================================================================
  function renderCurrentTabContent(tab, orders, activeOrderFull, suppliers, user) {
    switch (tab) {
      case 'orders':
        return renderTabOrders(orders, suppliers);
      case 'packing':
        return renderTabPacking(orders, activeOrderFull);
      case 'fix':
        return renderTabFix(orders, activeOrderFull);
      case 'transit':
        return renderTabTransit(orders, activeOrderFull);
      case 'statements':
        return renderTabStatements(suppliers);
      default:
        return `<div class="p-8 text-center text-slate-400">Pestaña no disponible</div>`;
    }
  }

  // =========================================================================
  // PESTAÑA 1: GESTOR DE ÓRDENES DE COMPRA (OC)
  // =========================================================================
  function renderTabOrders(orders, suppliers) {
    const { esc, grams, badge } = window.MartelaUI;

    let filtered = [...orders];
    if (filterSearch) {
      const q = filterSearch.toLowerCase();
      filtered = filtered.filter(o => 
        o.folio_oc.toLowerCase().includes(q) || 
        o.proveedor_nombre.toLowerCase().includes(q) ||
        (o.notas && o.notas.toLowerCase().includes(q))
      );
    }
    if (filterStatus) {
      filtered = filtered.filter(o => o.estatus === filterStatus);
    }

    const oPag = window.MartelaUI.paginate(filtered, ordersPage, ordersPageSize);

    return `
      <div class="space-y-4">
        <!-- Filtros y Barra de Búsqueda -->
        <div class="panel p-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div class="relative flex-1 sm:w-64">
              <input 
                type="text" 
                placeholder="Buscar por folio o fabricante..." 
                value="${esc(filterSearch)}" 
                oninput="MartelaPurchases.handleSearch(this.value)"
                class="w-full text-xs pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              />
              <span class="absolute left-2.5 top-2.5 text-slate-400 text-xs pointer-events-none">🔍</span>
            </div>

            <select 
              onchange="MartelaPurchases.handleStatusFilter(this.value)"
              class="text-xs py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
            >
              <option value="">Todos los Estatus (${orders.length})</option>
              <option value="BORRADOR" ${filterStatus === 'BORRADOR' ? 'selected' : ''}>Borrador</option>
              <option value="PROFORMA_PENDIENTE" ${filterStatus === 'PROFORMA_PENDIENTE' ? 'selected' : ''}>Proforma Pendiente</option>
              <option value="PACKING_AUDITADO" ${filterStatus === 'PACKING_AUDITADO' ? 'selected' : ''}>Packing Auditado (±5%)</option>
              <option value="FIX_CERRADO" ${filterStatus === 'FIX_CERRADO' ? 'selected' : ''}>Fix Cerrado</option>
              <option value="EN_TRANSITO" ${filterStatus === 'EN_TRANSITO' ? 'selected' : ''}>En Tránsito Aéreo</option>
              <option value="ENTREGADO_BOVEDA" ${filterStatus === 'ENTREGADO_BOVEDA' ? 'selected' : ''}>Entregado en Bóveda</option>
            </select>
          </div>

          <div class="text-xs text-slate-400">
            Regla de Compra: <b>OC sin precio de venta ni costo de oro congelado</b>
          </div>
        </div>

        <!-- Tabla Paginada de Órdenes de Compra -->
        <div class="panel overflow-hidden bg-white dark:bg-slate-900">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-mono text-xs font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th class="py-3.5 px-3">Folio OC</th>
                  <th class="py-3.5 px-3">Fabricante</th>
                  <th class="py-3.5 px-3 text-center">Partidas</th>
                  <th class="py-3.5 px-3 text-right">Oro Teórico</th>
                  <th class="py-3.5 px-3 text-right">M.O. Estimada</th>
                  <th class="py-3.5 px-3 text-right">Fix Cerrado</th>
                  <th class="py-3.5 px-3 text-right">Importe Liquidable</th>
                  <th class="py-3.5 px-3 text-center">Estatus</th>
                  <th class="py-3.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                ${oPag.items.length === 0 ? `
                  <tr>
                    <td colspan="9" class="p-8 text-center text-slate-400">No se encontraron órdenes de compra registradas.</td>
                  </tr>
                ` : oPag.items.map(o => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${o.id_oc === selectedOcId ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''}">
                    <td class="py-3.5 px-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      ${esc(o.folio_oc)}
                      <div class="text-xs text-slate-500 font-normal">${esc(o.fecha_emision ? o.fecha_emision.slice(0, 10) : '')}</div>
                    </td>
                    <td class="py-3.5 px-3">
                      <div class="font-bold text-slate-900 dark:text-white text-sm">${esc(o.proveedor_nombre)}</div>
                      <div class="text-xs text-slate-500">${esc(o.pais_origen)} · ${esc(o.moneda)}</div>
                    </td>
                    <td class="py-3.5 px-3 text-center font-mono">
                      <span class="font-bold text-slate-800 dark:text-slate-200 text-sm">${o.total_lineas || 1} lín.</span>
                      <div class="text-xs text-slate-500">${o.total_piezas || 0} pzs</div>
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono font-bold text-purple-600 dark:text-purple-400 text-sm">
                      ${grams(o.peso_oro_teorico_total_g)}
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                      $${Number(o.costo_mo_total_estimado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${esc(o.moneda)}
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono font-bold">
                      ${o.fix_oro_cerrado_usd ? `<span class="text-amber-600 font-black">$${o.fix_oro_cerrado_usd}</span>` : `<span class="text-slate-400 font-normal italic">Pendiente</span>`}
                    </td>
                    <td class="py-3.5 px-3 text-right font-mono font-black text-slate-900 dark:text-white text-sm">
                      $${Number(o.importe_total_liquidable || o.costo_mo_total_estimado).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${esc(o.moneda)}
                    </td>
                    <td class="py-3.5 px-3 text-center">
                      ${renderStatusBadge(o.estatus)}
                    </td>
                    <td class="py-3.5 px-3 text-center">
                      <div class="flex items-center justify-center gap-1.5">
                        <button 
                          onclick="MartelaPurchases.selectOrderAndTab(${o.id_oc}, 'packing')" 
                          class="btn btn-soft text-xs py-1.5 px-2.5 font-bold text-amber-600 hover:bg-amber-500/10"
                          title="Auditar Packing List de esta orden"
                        >
                          ⚖️ Packing
                        </button>
                        <button 
                          onclick="MartelaPurchases.selectOrderAndTab(${o.id_oc}, 'fix')" 
                          class="btn btn-soft text-xs py-1.5 px-2.5 font-bold text-emerald-600 hover:bg-emerald-500/10"
                          title="Cerrar Fix y liquidar"
                        >
                          📈 Fix
                        </button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Paginador Universal Estandarizado (20, 50, 100) -->
          ${window.MartelaUI.renderPaginationControls({
            currentPage: oPag.currentPage,
            totalPages: oPag.totalPages,
            pageSize: oPag.pageSize,
            totalItems: oPag.totalItems,
            startIndex: oPag.startIndex,
            endIndex: oPag.endIndex,
            onPageChange: 'MartelaPurchases.goToOrdersPage',
            onPageSizeChange: 'MartelaPurchases.setOrdersPageSize'
          })}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PESTAÑA 2: MESA DE AUDITORÍA DE PACKING LIST (±5% TOLERANCIA)
  // =========================================================================
  function renderTabPacking(orders, activeOrderFull) {
    const { esc, grams, money } = window.MartelaUI;
    if (!activeOrderFull) {
      return `<div class="p-8 text-center text-slate-400">Seleccione una orden de compra para auditar el packing list.</div>`;
    }

    const order = activeOrderFull;
    const lines = order.lineas || [];

    // Calcular si alguna línea excede tolerancia
    const anyExceeded = lines.some(l => l.estatus_tolerancia === 'EXCEDE_TOLERANCIA_MAX' || l.estatus_tolerancia === 'BAJO_TOLERANCIA_MIN');
    const allPending = lines.every(l => !l.peso_packing_total_g || l.peso_packing_total_g === 0);

    return `
      <div class="space-y-6">
        <!-- Selector Rápido de Orden & Banner de Tolerancia -->
        <div class="panel p-5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Mesa de Auditoría de Embalaje</div>
            <div class="flex items-center gap-3">
              <select 
                onchange="MartelaPurchases.selectOrderAndTab(this.value, 'packing')"
                class="text-sm font-mono font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                ${orders.map(o => `
                  <option value="${o.id_oc}" ${o.id_oc === order.id_oc ? 'selected' : ''}>
                    ${o.folio_oc} — ${o.proveedor_nombre} (${o.estatus})
                  </option>
                `).join('')}
              </select>
              <span class="text-xs text-slate-500">Fabricante: <b>${esc(order.proveedor_nombre)}</b> (${esc(order.pais_origen)})</span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button 
              onclick="MartelaPurchases.simulatePackingTolerance(false)" 
              class="btn btn-soft text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Simula que el fabricante entregó piezas dentro del rango ±5%"
            >
              ✓ Simular Packing Óptimo (+1.2% Aprobado)
            </button>
            <button 
              onclick="MartelaPurchases.simulatePackingTolerance(true)" 
              class="btn btn-soft text-xs text-rose-500 border-rose-500/30 hover:bg-rose-500/10"
              title="Simula que el fabricante entregó con sobrepeso (+7.8%), bloqueando la orden"
            >
              ⚠️ Simular Desvío (+7.8% Rechazo)
            </button>
          </div>
        </div>

        <!-- Banner Explicativo del Candado Joyero -->
        <div class="p-4 rounded-2xl ${anyExceeded ? 'bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300' : (allPending ? 'bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300')} text-xs">
          <div class="font-bold flex items-center gap-2">
            <span>${anyExceeded ? '⚠️ CANDADO DE TOLERANCIA ESTRICTA (±5%) ACTIVADO' : (allPending ? 'ℹ️ PACKING LIST PENDIENTE DE AUDITAR' : '✓ PACKING LIST CONCILIADO DENTRO DE TOLERANCIA')}</span>
          </div>
          <div class="mt-1">
            ${anyExceeded 
              ? 'Existen partidas con variaciones superiores al ±5%. El fabricante colocó metal excedente no autorizado o las piezas tienen bajo peso estructural. El avance a Cierre de Fix queda <b>BLOQUEADO</b> hasta corregir el packing o refabricar.'
              : (allPending 
                  ? 'Compare el peso real reportado en la Lista de Empaque del fabricante vs. el peso teórico estipulado en la Orden de Compra.'
                  : 'Todas las partidas se encuentran dentro del umbral permitido de ±5.0%. La orden está lista para congelar el Fix de Metal con Finanzas.')
            }
          </div>
        </div>

        <!-- Comparador Tabular Lado a Lado -->
        <div class="panel overflow-hidden bg-white dark:bg-slate-900">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th class="p-3">SKU / Modelo Martela</th>
                  <th class="p-3">Modelo Proveedor</th>
                  <th class="p-3 text-center">Cant.</th>
                  <th class="p-3 text-right">Peso Teór. Unit</th>
                  <th class="p-3 text-right">Peso Teór. Total</th>
                  <th class="p-3 text-right font-bold text-amber-600">Peso Packing Real</th>
                  <th class="p-3 text-right">Diferencia</th>
                  <th class="p-3 text-center">Variación %</th>
                  <th class="p-3 text-center">Semáforo Tolerancia</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                ${lines.map((l, idx) => {
                  const pesoTeorico = l.peso_teorico_total_g;
                  const pesoReal = l.peso_packing_total_g || pesoTeorico;
                  const dif = +(pesoReal - pesoTeorico).toFixed(4);
                  const varPct = l.variacion_peso_porcentaje !== undefined ? l.variacion_peso_porcentaje : +((dif / pesoTeorico) * 100).toFixed(2);
                  const isExceeded = Math.abs(varPct) > 5.0;

                  return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td class="p-3 font-bold text-slate-900 dark:text-white">
                        <div>${esc(l.sku)}</div>
                        <div class="text-[10px] text-slate-400 font-sans">${esc(l.descripcion)}</div>
                      </td>
                      <td class="p-3 text-amber-600 dark:text-amber-400 font-semibold">${esc(l.modelo_proveedor)}</td>
                      <td class="p-3 text-center font-bold">${l.cantidad_piezas}</td>
                      <td class="p-3 text-right">${grams(l.peso_teorico_unitario_g)}</td>
                      <td class="p-3 text-right font-bold text-purple-600 dark:text-purple-400">${grams(pesoTeorico)}</td>
                      <td class="p-3 text-right">
                        <input 
                          type="number" 
                          step="0.01" 
                          id="packWeight_${l.id_linea}"
                          value="${pesoReal.toFixed(2)}"
                          onchange="MartelaPurchases.handlePackingLineWeightChange(${l.id_linea}, this.value)"
                          class="w-24 text-right p-1 text-xs font-mono font-bold rounded border ${isExceeded ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-amber-600'}"
                        /> g
                      </td>
                      <td class="p-3 text-right font-bold ${dif > 0 ? 'text-amber-600' : (dif < 0 ? 'text-blue-500' : 'text-slate-400')}">
                        ${dif > 0 ? '+' : ''}${dif.toFixed(2)} g
                      </td>
                      <td class="p-3 text-center font-black ${isExceeded ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}">
                        ${varPct > 0 ? '+' : ''}${varPct.toFixed(2)}%
                      </td>
                      <td class="p-3 text-center">
                        ${renderToleranceBadge(varPct, l.estatus_tolerancia)}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="text-xs">
              <span class="text-slate-400">Total Teórico:</span> <b>${grams(order.peso_oro_teorico_total_g)}</b> | 
              <span class="text-slate-400">Total Packing Real:</span> <b class="text-amber-600">${grams(order.peso_packing_total_g || order.peso_oro_teorico_total_g)}</b> |
              <span class="text-slate-400">Variación Global:</span> <b class="${Math.abs(order.variacion_peso_total_pct || 0) > 5 ? 'text-rose-600' : 'text-emerald-600'}">${(order.variacion_peso_total_pct || 0) > 0 ? '+' : ''}${order.variacion_peso_total_pct || 0}%</b>
            </div>

            <button 
              onclick="MartelaPurchases.approvePackingList(${order.id_oc})" 
              class="btn btn-gold font-bold text-xs py-2 px-5 ${anyExceeded ? 'opacity-50 cursor-not-allowed' : ''}"
              ${anyExceeded ? 'disabled' : ''}
            >
              <span>🔒</span> Aprobar Packing List y Proceder a Cierre de Fix
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PESTAÑA 3: CIERRE DE FIX INTERNACIONAL & LIQUIDACIÓN
  // =========================================================================
  function renderTabFix(orders, activeOrderFull) {
    const { esc, grams, money } = window.MartelaUI;
    if (!activeOrderFull) {
      return `<div class="p-8 text-center text-slate-400">Seleccione una orden de compra para congelar el Fix de metal.</div>`;
    }

    const order = activeOrderFull;
    const db = window.apiFacade._getDB();
    const rates = db.metal_rates || {};
    const defaultFix = order.fix_oro_cerrado_usd || rates.fix_oro_hoy_usd || 2680.00;
    const defaultTc = order.tipo_cambio_cerrado || rates.tipo_cambio_usd_mxn || 20.15;

    const pesoTotalG = order.peso_packing_total_g > 0 ? order.peso_packing_total_g : order.peso_oro_teorico_total_g;

    return `
      <div class="space-y-6">
        <!-- Selector de Orden y Estado -->
        <div class="panel p-5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Cierre de Fix de Compra</div>
            <div class="flex items-center gap-3">
              <select 
                onchange="MartelaPurchases.selectOrderAndTab(this.value, 'fix')"
                class="text-sm font-mono font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                ${orders.map(o => `
                  <option value="${o.id_oc}" ${o.id_oc === order.id_oc ? 'selected' : ''}>
                    ${o.folio_oc} — ${o.proveedor_nombre} (${o.estatus})
                  </option>
                `).join('')}
              </select>
              <span class="text-xs text-slate-500">Estatus: <b>${order.estatus}</b></span>
            </div>
          </div>

          <div class="text-right">
            <span class="text-[10px] text-slate-400 uppercase font-semibold">Peso Base Liquidable</span>
            <div class="text-lg font-black font-mono text-purple-600 dark:text-purple-400">${grams(pesoTotalG)}</div>
          </div>
        </div>

        <!-- Calculadora de Cierre Fix Bipartita -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="panel p-5 bg-white dark:bg-slate-900 space-y-4">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>📈 Parámetros de Mercado Pactados con el Fabricante</span>
            </h3>

            <div class="space-y-3 text-xs">
              <div>
                <label class="block font-semibold text-slate-500 mb-1">Fix Oro Internacional (London Spot USD/oz troy):</label>
                <div class="flex gap-2">
                  <input 
                    type="number" 
                    step="0.01" 
                    id="inputFixGoldUsd" 
                    value="${defaultFix}" 
                    oninput="MartelaPurchases.recalcFixLiquidation()"
                    class="flex-1 p-2 font-mono font-bold text-amber-600 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                  />
                  <button onclick="document.getElementById('inputFixGoldUsd').value='2680.00'; MartelaPurchases.recalcFixLiquidation();" class="btn btn-soft text-xs py-1 px-2.5">
                    Fix $2,680
                  </button>
                  <button onclick="document.getElementById('inputFixGoldUsd').value='2650.00'; MartelaPurchases.recalcFixLiquidation();" class="btn btn-soft text-xs py-1 px-2.5">
                    Fix $2,650
                  </button>
                </div>
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Tipo de Cambio USD / MXN:</label>
                <input 
                  type="number" 
                  step="0.0001" 
                  id="inputFixTc" 
                  value="${defaultTc}" 
                  oninput="MartelaPurchases.recalcFixLiquidation()"
                  class="w-full p-2 font-mono font-bold text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right"
                />
              </div>

              <div class="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-1.5 font-mono text-[11px]">
                <div class="flex justify-between">
                  <span class="text-slate-400">1 Onza Troy:</span>
                  <span>31.1035 gramos</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Factor Oro 10K (Ley 0.41667):</span>
                  <span id="labelGramo10kUsd">Calculando...</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-400">Factor Oro 14K (Ley 0.58333):</span>
                  <span id="labelGramo14kUsd">Calculando...</span>
                </div>
              </div>
            </div>

            <button 
              onclick="MartelaPurchases.submitCloseFix(${order.id_oc})" 
              class="btn btn-gold w-full font-bold py-2.5"
            >
              <span>🔒</span> Congelar Fix y Generar Póliza de Compra
            </button>
          </div>

          <!-- Tablero de Desglose Bipartito (Metal + Mano de Obra) -->
          <div class="panel p-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl shadow-xl flex flex-col justify-between">
            <div>
              <div class="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Desglose Bipartito Oficial</div>
              <h4 class="text-lg font-black mt-1">Liquidación Final de Factura Comercial</h4>
              <p class="text-xs text-slate-400 mt-0.5">Suma estricta de metal puro valorizado + tarifa de hechura pactada.</p>
              
              <div class="mt-6 space-y-3 font-mono text-xs">
                <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                  <div>
                    <div class="font-bold text-slate-200">1. Costo Metal Oro Puro</div>
                    <div class="text-[10px] text-slate-400">${grams(pesoTotalG)} valorizado al Fix</div>
                  </div>
                  <div class="text-base font-black text-amber-400" id="boardMetalUsd">$0.00 USD</div>
                </div>

                <div class="p-3 rounded-xl bg-slate-800/80 border border-slate-700 flex justify-between items-center">
                  <div>
                    <div class="font-bold text-slate-200">2. Costo Mano de Obra (M.O.)</div>
                    <div class="text-[10px] text-slate-400">Tarifa fija por pieza/gramo</div>
                  </div>
                  <div class="text-base font-black text-emerald-400">$${Number(order.costo_mo_total_estimado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} USD</div>
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-slate-800 flex justify-between items-end">
              <div>
                <div class="text-[10px] uppercase font-bold text-slate-400">Total Liquidable Fabricante</div>
                <div class="text-2xl font-black font-mono text-white" id="boardTotalUsd">$0.00 USD</div>
              </div>
              <div class="text-right">
                <div class="text-[10px] uppercase font-bold text-slate-400">Equivalente MXN</div>
                <div class="text-lg font-black font-mono text-amber-400" id="boardTotalMxn">$0.00 MXN</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PESTAÑA 4: TRACKING ADUANAL & ENLACE A BÓVEDA
  // =========================================================================
  function renderTabTransit(orders, activeOrderFull) {
    const { esc, grams, money } = window.MartelaUI;
    const transitOrders = orders.filter(o => o.estatus === 'EN_TRANSITO' || o.estatus === 'ENTREGADO_BOVEDA' || o.estatus === 'FIX_CERRADO');
    const order = activeOrderFull || transitOrders[0] || orders[0];
    const log = order?.logistica || {
      transportista_aerolinea: 'FedEx Express',
      guia_tracking: order?.guia_tracking || 'FDX-7894512039-HK',
      agente_aduanal: 'Eduardo Mendoza (Agencia Aduanal del Valle)',
      costo_flete_divisa: 485.00,
      impuestos_aduanales_mxn: 23187.00,
      estatus_transito: 'EN_VUELO'
    };

    return `
      <div class="space-y-6">
        <div class="panel p-5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Rastreo de Carga Aérea y Despacho Aduanal</div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white">Trazabilidad Internacional con Eduardo (Aduanas)</h3>
            <p class="text-xs text-slate-500">Conexión directa: Al aterrizar la valija, se despacha al Módulo 2 con David Morales.</p>
          </div>

          <button 
            onclick="MartelaPurchases.notifyArrival(${order.id_oc})" 
            class="btn btn-gold font-bold text-xs py-2 px-4 shadow-md flex items-center gap-2 ${order.estatus === 'ENTREGADO_BOVEDA' ? 'opacity-60 cursor-not-allowed' : ''}"
            ${order.estatus === 'ENTREGADO_BOVEDA' ? 'disabled' : ''}
          >
            <span>📦</span> Notificar Arribo a Bóveda (David Morales)
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="panel p-5 bg-white dark:bg-slate-900 md:col-span-2 space-y-4">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Datos del Embarque Aéreo</h4>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label class="block font-semibold text-slate-500 mb-1">Guía Aérea / Tracking:</label>
                <input 
                  type="text" 
                  id="logGuia" 
                  value="${esc(log.guia_tracking)}" 
                  class="w-full p-2 font-mono font-bold text-amber-600 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Aerolínea / Transportista:</label>
                <select id="logCarrier" class="w-full p-2 font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <option value="FedEx Express" ${log.transportista_aerolinea === 'FedEx Express' ? 'selected' : ''}>FedEx Express International Priority</option>
                  <option value="Cometra Internacional" ${log.transportista_aerolinea === 'Cometra Internacional' ? 'selected' : ''}>Cometra Blindados Internacional</option>
                  <option value="Emirates SkyCargo" ${log.transportista_aerolinea === 'Emirates SkyCargo' ? 'selected' : ''}>Emirates SkyCargo Precious Metals</option>
                </select>
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Agente Aduanal:</label>
                <input 
                  type="text" 
                  id="logAgent" 
                  value="${esc(log.agente_aduanal)}" 
                  class="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label class="block font-semibold text-slate-500 mb-1">Estatus en Aduana:</label>
                <select id="logStatus" class="w-full p-2 font-bold text-blue-500 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <option value="EN_VUELO">En Vuelo Internacional</option>
                  <option value="EN_ADUANA_MEXICO">En Aduana AICM / Manzanillo</option>
                  <option value="LIBERADO_RUTA_OFICINA">Liberado en Ruta a MARTELA</option>
                </select>
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button onclick="MartelaPurchases.saveLogistics(${order.id_oc})" class="btn btn-soft text-xs py-1.5 px-3">
                Guardar Datos de Rastreo
              </button>
            </div>
          </div>

          <div class="panel p-5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
            <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Enlace con Módulo 2</h4>
            <div class="space-y-2 text-slate-600 dark:text-slate-300">
              <div>• Orden Vinculada: <b>${esc(order.folio_oc)}</b></div>
              <div>• Proveedor: <b>${esc(order.proveedor_nombre)}</b></div>
              <div>• Peso Bruto del Paquete: <b>${grams(order.peso_packing_total_g || order.peso_oro_teorico_total_g)}</b></div>
              <div>• Estatus Entrega: <b>${order.estatus === 'ENTREGADO_BOVEDA' ? '✅ Ya en Bóveda' : '✈️ En Camino'}</b></div>
            </div>

            <div class="pt-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400">
              Al notificar el arribo, la guía se registra en el visor de paquetería de David para inspección en báscula y video-evidencia.
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PESTAÑA 5: ESTADO DE CUENTA & NOTAS DE CRÉDITO
  // =========================================================================
  function renderTabStatements(suppliers) {
    const { esc, money } = window.MartelaUI;
    const db = window.apiFacade._getDB();
    const currentProv = suppliers.find(p => p.id === selectedSupplierId) || suppliers[0];

    const allMovements = (db.proveedor_estado_cuenta || []).filter(m => m.id_proveedor === currentProv.id);
    const sPag = window.MartelaUI.paginate(allMovements, statementsPage, statementsPageSize);

    let totalCompras = 0;
    let totalAnticipos = 0;
    let totalLiquidaciones = 0;
    let totalNotasCredito = 0;

    allMovements.forEach(m => {
      const val = Math.abs(m.monto_divisa || 0);
      if (m.tipo_movimiento === 'CARGO_COMPRA') totalCompras += val;
      else if (m.tipo_movimiento === 'ANTICIPO_PAGADO') totalAnticipos += val;
      else if (m.tipo_movimiento === 'LIQUIDACION_PAGADA') totalLiquidaciones += val;
      else if (m.tipo_movimiento === 'NOTA_CREDITO_DEFECTOS') totalNotasCredito += val;
    });

    const saldoPendiente = +(totalCompras - totalAnticipos - totalLiquidaciones - totalNotasCredito).toFixed(2);
    const moneda = currentProv.moneda_defecto || currentProv.moneda_compra || 'USD';

    return `
      <div class="space-y-6">
        <!-- Selector de Proveedor -->
        <div class="panel p-5 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">Libro Mayor de Fabricante</div>
            <div class="flex items-center gap-3">
              <select 
                onchange="MartelaPurchases.handleSupplierStatementChange(this.value)"
                class="text-sm font-bold py-1.5 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
              >
                ${suppliers.map(p => `
                  <option value="${p.id}" ${p.id === currentProv.id ? 'selected' : ''}>
                    ${p.razon_social} (${p.pais_origen})
                  </option>
                `).join('')}
              </select>
              <span class="text-xs text-slate-400">Moneda: <b>${moneda}</b></span>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button onclick="MartelaPurchases.openPaymentModal(${currentProv.id})" class="btn btn-gold text-xs py-2 px-3 font-bold">
              💳 Registrar Anticipo / Pago
            </button>
            <button onclick="MartelaPurchases.openCreditNoteModal(${currentProv.id})" class="btn btn-soft text-xs py-2 px-3 text-rose-500 font-bold border-rose-500/30 hover:bg-rose-500/10">
              📝 Nota de Crédito (Calidad)
            </button>
          </div>
        </div>

        <!-- 4 Tarjetas de Balance de Proveedor -->
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div class="panel p-4 border-l-4 border-slate-400 bg-white dark:bg-slate-900">
            <div class="text-xs text-slate-400 uppercase font-semibold">Total Compras Facturadas</div>
            <div class="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">$${totalCompras.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}</div>
            <div class="text-[10px] text-slate-400">Cargos por OCs cerradas</div>
          </div>

          <div class="panel p-4 border-l-4 border-emerald-500 bg-white dark:bg-slate-900">
            <div class="text-xs text-slate-400 uppercase font-semibold">Anticipos / Pagos Realizados</div>
            <div class="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">$${(totalAnticipos + totalLiquidaciones).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}</div>
            <div class="text-[10px] text-slate-400">Transferencias internacionales</div>
          </div>

          <div class="panel p-4 border-l-4 border-rose-500 bg-white dark:bg-slate-900">
            <div class="text-xs text-slate-400 uppercase font-semibold">Notas de Crédito (Fundición)</div>
            <div class="text-xl font-black font-mono text-rose-500 mt-1">-$${totalNotasCredito.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}</div>
            <div class="text-[10px] text-slate-400">Cobro de M.O. por piezas dañadas</div>
          </div>

          <div class="panel p-4 border-l-4 border-amber-500 bg-white dark:bg-slate-900">
            <div class="text-xs text-slate-400 uppercase font-semibold">Saldo Pendiente por Liquidar</div>
            <div class="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">$${saldoPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${moneda}</div>
            <div class="text-[10px] text-amber-500 font-bold">Balance acumulado a favor proveedor</div>
          </div>
        </div>

        <!-- Tabla de Movimientos del Estado de Cuenta -->
        <div class="panel overflow-hidden bg-white dark:bg-slate-900">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th class="p-3">Fecha y Hora</th>
                  <th class="p-3">Tipo Movimiento</th>
                  <th class="p-3">Documento / Ref</th>
                  <th class="p-3 text-right">Monto</th>
                  <th class="p-3">Observaciones de Auditoría</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                ${sPag.items.length === 0 ? `
                  <tr>
                    <td colspan="5" class="p-8 text-center text-slate-400 font-sans">No hay movimientos registrados para este fabricante.</td>
                  </tr>
                ` : sPag.items.map(m => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3 text-slate-500">${esc(m.fecha_registro)}</td>
                    <td class="p-3 font-bold">${renderMovementBadge(m.tipo_movimiento)}</td>
                    <td class="p-3 font-semibold text-slate-900 dark:text-white">${esc(m.folio_documento)}</td>
                    <td class="p-3 text-right font-black ${m.monto_divisa > 0 ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'}">
                      ${m.monto_divisa > 0 ? '+' : ''}$${Number(m.monto_divisa).toLocaleString('es-MX', { minimumFractionDigits: 2 })} ${esc(m.moneda || moneda)}
                    </td>
                    <td class="p-3 font-sans text-slate-600 dark:text-slate-300 text-xs">${esc(m.observaciones)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${window.MartelaUI.renderPaginationControls({
            currentPage: sPag.currentPage,
            totalPages: sPag.totalPages,
            pageSize: sPag.pageSize,
            totalItems: sPag.totalItems,
            startIndex: sPag.startIndex,
            endIndex: sPag.endIndex,
            onPageChange: 'MartelaPurchases.goToStatementsPage',
            onPageSizeChange: 'MartelaPurchases.setStatementsPageSize'
          })}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // MODALES: NUEVA OC, PAGO Y NOTA DE CRÉDITO
  // =========================================================================

  function openNewOcModal() {
    const db = window.apiFacade._getDB();
    const suppliers = db.proveedores || [];
    const products = db.products_sku || [];

    const html = `
      <form onsubmit="MartelaPurchases.handleSaveNewOc(event)" class="space-y-4 text-xs">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="block font-semibold text-slate-500 mb-1">Fabricante Internacional:</label>
            <select name="id_proveedor" id="newOcProvSelect" required class="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold">
              ${suppliers.map(p => `
                <option value="${p.id}">${p.razon_social} (${p.pais_origen})</option>
              `).join('')}
            </select>
          </div>

          <div>
            <label class="block font-semibold text-slate-500 mb-1">Fecha Promesa de Entrega:</label>
            <input type="date" name="fecha_promesa" required value="2026-12-15" class="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono" />
          </div>

          <div>
            <label class="block font-semibold text-slate-500 mb-1">Notas / Colección:</label>
            <input type="text" name="notas" value="Colección Temporada Navideña Joyería Fina" class="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800" />
          </div>
        </div>

        <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-800 dark:text-amber-300 text-[11px]">
          <b>Peculiaridad Joyera:</b> La OC se emite con Cantidad, Gramos Teóricos y Costo de Mano de Obra (M.O.). El precio del oro no se fija aquí, sino al auditar el packing list y congelar el Fix.
        </div>

        <div class="border border-slate-200 dark:border-slate-800 rounded-xl p-3 space-y-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div class="flex justify-between items-center">
            <span class="font-bold text-slate-800 dark:text-slate-200">Partidas de la Orden de Compra:</span>
            <span class="text-[11px] text-slate-400">* Los modelos nuevos se pre-registran automáticamente en el Catálogo Maestro</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono" id="newOcLinesTable">
              <thead class="bg-slate-200 dark:bg-slate-800 text-slate-600 uppercase text-[10px]">
                <tr>
                  <th class="p-2">Modelo Proveedor</th>
                  <th class="p-2">Descripción</th>
                  <th class="p-2">Kilataje</th>
                  <th class="p-2 text-center">Cant.</th>
                  <th class="p-2 text-right">Peso Teór. (g)</th>
                  <th class="p-2 text-right">M.O. ($ USD)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 dark:divide-slate-800">
                <tr>
                  <td class="p-2">
                    <input type="text" name="line_mod_0" value="FF-9020-CZ" required class="w-full p-1 border rounded font-bold" />
                  </td>
                  <td class="p-2">
                    <input type="text" name="line_desc_0" value="Anillo Solitario Circonia Suiza" required class="w-full p-1 border rounded" />
                  </td>
                  <td class="p-2">
                    <select name="line_kil_0" class="p-1 border rounded font-bold">
                      <option value="10K">10K</option>
                      <option value="14K" selected>14K</option>
                      <option value="PLATA_925">Plata .925</option>
                    </select>
                  </td>
                  <td class="p-2 text-center">
                    <input type="number" name="line_qty_0" value="100" min="1" required class="w-16 p-1 border rounded text-center font-bold" />
                  </td>
                  <td class="p-2 text-right">
                    <input type="number" name="line_weight_0" value="2.35" step="0.01" min="0.1" required class="w-20 p-1 border rounded text-right font-bold" />
                  </td>
                  <td class="p-2 text-right">
                    <input type="number" name="line_mo_0" value="11.50" step="0.01" min="0.1" required class="w-20 p-1 border rounded text-right font-bold text-emerald-600" />
                  </td>
                </tr>
                <tr>
                  <td class="p-2">
                    <input type="text" name="line_mod_1" value="FF-CAD-FORZ" required class="w-full p-1 border rounded font-bold" />
                  </td>
                  <td class="p-2">
                    <input type="text" name="line_desc_1" value="Cadena Forzada Diamantada 45cm" required class="w-full p-1 border rounded" />
                  </td>
                  <td class="p-2">
                    <select name="line_kil_1" class="p-1 border rounded font-bold">
                      <option value="10K">10K</option>
                      <option value="14K" selected>14K</option>
                      <option value="PLATA_925">Plata .925</option>
                    </select>
                  </td>
                  <td class="p-2 text-center">
                    <input type="number" name="line_qty_1" value="50" min="1" required class="w-16 p-1 border rounded text-center font-bold" />
                  </td>
                  <td class="p-2 text-right">
                    <input type="number" name="line_weight_1" value="4.10" step="0.01" min="0.1" required class="w-20 p-1 border rounded text-right font-bold" />
                  </td>
                  <td class="p-2 text-right">
                    <input type="number" name="line_mo_1" value="18.00" step="0.01" min="0.1" required class="w-20 p-1 border rounded text-right font-bold text-emerald-600" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold font-bold">Emitir Orden de Compra (OC) →</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal('Emitir Nueva Orden de Compra Internacional', html, 'max-w-3xl');
  }

  async function handleSaveNewOc(e) {
    e.preventDefault();
    const f = new FormData(e.target);
    const idProv = parseInt(f.get('id_proveedor'), 10);
    const fechaPromesa = f.get('fecha_promesa');
    const notas = f.get('notas');

    const lineas = [
      {
        modelo_proveedor: f.get('line_mod_0'),
        descripcion: f.get('line_desc_0'),
        kilataje: f.get('line_kil_0'),
        cantidad_piezas: parseInt(f.get('line_qty_0'), 10),
        peso_teorico_unitario_g: parseFloat(f.get('line_weight_0')),
        costo_mo_unitario: parseFloat(f.get('line_mo_0'))
      },
      {
        modelo_proveedor: f.get('line_mod_1'),
        descripcion: f.get('line_desc_1'),
        kilataje: f.get('line_kil_1'),
        cantidad_piezas: parseInt(f.get('line_qty_1'), 10),
        peso_teorico_unitario_g: parseFloat(f.get('line_weight_1')),
        costo_mo_unitario: parseFloat(f.get('line_mo_1'))
      }
    ];

    await window.MartelaUI.withLoading('Registrando orden de compra y aplicando alta anticipada en catálogo...', async () => {
      try {
        const newOc = await window.apiFacade.createPurchaseOrder({
          id_proveedor: idProv,
          fecha_promesa_entrega: fechaPromesa,
          notas: notas,
          lineas: lineas
        });

        window.MartelaUI.closeModal();
        window.MartelaUI.toast(`Orden ${newOc.folio_oc} emitida con éxito. Modelos pre-registrados en catálogo.`, 'success');
        selectedOcId = newOc.id_oc;
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  function openPaymentModal(idProv) {
    const db = window.apiFacade._getDB();
    const prov = db.proveedores.find(p => p.id === idProv);
    const ocs = (db.ordenes_compra || []).filter(o => o.id_proveedor === idProv);

    const html = `
      <form onsubmit="MartelaPurchases.handleSavePayment(event, ${idProv})" class="space-y-4 text-xs">
        <div>
          <label class="block font-semibold text-slate-500 mb-1">Fabricante:</label>
          <input type="text" readonly value="${prov?.razon_social}" class="w-full p-2 bg-slate-100 dark:bg-slate-800 font-bold rounded" />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-500 mb-1">Tipo de Pago:</label>
            <select name="tipo_movimiento" class="w-full p-2 border rounded font-semibold">
              <option value="ANTICIPO_PAGADO">Anticipo de Producción (50%)</option>
              <option value="LIQUIDACION_PAGADA">Liquidación Final Factura</option>
            </select>
          </div>
          <div>
            <label class="block font-semibold text-slate-500 mb-1">Orden Relacionada (Opcional):</label>
            <select name="id_oc" class="w-full p-2 border rounded font-mono">
              <option value="">Sin orden específica</option>
              ${ocs.map(o => `<option value="${o.id_oc}">${o.folio_oc} (${o.estatus})</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block font-semibold text-slate-500 mb-1">Monto a Transferir (${prov?.moneda_defecto || 'USD'}):</label>
            <input type="number" step="0.01" name="monto" value="15000.00" required class="w-full p-2 font-mono font-bold text-emerald-600 text-right border rounded" />
          </div>
          <div>
            <label class="block font-semibold text-slate-500 mb-1">Folio / Referencia Swift / SPEI:</label>
            <input type="text" name="ref" value="SWIFT-BBVA-908123" required class="w-full p-2 font-mono border rounded" />
          </div>
        </div>

        <div>
          <label class="block font-semibold text-slate-500 mb-1">Observaciones:</label>
          <input type="text" name="obs" value="Anticipo del 50% para arranque de fundición en taller" class="w-full p-2 border rounded" />
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold font-bold">Aplicar Pago a Estado de Cuenta</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal(`Registrar Pago / Transferencia · ${prov?.razon_social}`, html, 'max-w-md');
  }

  async function handleSavePayment(e, idProv) {
    e.preventDefault();
    const f = new FormData(e.target);
    const idOc = f.get('id_oc') ? parseInt(f.get('id_oc'), 10) : 1;
    const monto = parseFloat(f.get('monto'));
    const tipo = f.get('tipo_movimiento');
    const ref = f.get('ref');
    const obs = f.get('obs');

    await window.MartelaUI.withLoading('Registrando pago internacional en libro mayor...', async () => {
      try {
        await window.apiFacade.registerPurchasePayment(idOc, {
          tipo_movimiento: tipo,
          monto_divisa: monto,
          folio_documento: ref,
          observaciones: obs
        });

        window.MartelaUI.closeModal();
        window.MartelaUI.toast(`Pago de $${monto.toLocaleString('es-MX')} registrado correctamente`, 'success');
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  function openCreditNoteModal(idProv) {
    const db = window.apiFacade._getDB();
    const prov = db.proveedores.find(p => p.id === idProv);

    const html = `
      <form onsubmit="MartelaPurchases.handleSaveCreditNote(event, ${idProv})" class="space-y-4 text-xs">
        <div class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 text-[11px]">
          <b>Cobro de Mano de Obra por Merma:</b> Cuando David Morales o el Taller de Fundición mandan piezas al crisol por porosidad o fracturas de origen, se debita la M.O. al fabricante.
        </div>

        <div>
          <label class="block font-semibold text-slate-500 mb-1">Monto Nota de Crédito (${prov?.moneda_defecto || 'USD'}):</label>
          <input type="number" step="0.01" name="monto" value="480.00" required class="w-full p-2 font-mono font-bold text-rose-500 text-right border rounded" />
        </div>

        <div>
          <label class="block font-semibold text-slate-500 mb-1">Motivo Técnico / Piezas Dañadas:</label>
          <textarea name="motivo" rows="2" class="w-full p-2 border rounded" required>Cobro de M.O. por 2 esclavas con porosidad severa remitidas a fundición por David Morales.</textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn bg-rose-600 text-white font-bold hover:bg-rose-700">Aplicar Nota de Crédito</button>
        </div>
      </form>
    `;

    window.MartelaUI.openModal(`Nota de Crédito por Defecto de Fábrica · ${prov?.razon_social}`, html, 'max-w-md');
  }

  async function handleSaveCreditNote(e, idProv) {
    e.preventDefault();
    const f = new FormData(e.target);
    const monto = parseFloat(f.get('monto'));
    const motivo = f.get('motivo');

    await window.MartelaUI.withLoading('Aplicando nota de crédito por calidad...', async () => {
      try {
        await window.apiFacade.registerQualityCreditNote(idProv, monto, motivo);
        window.MartelaUI.closeModal();
        window.MartelaUI.toast(`Nota de crédito por $${monto} aplicada al saldo del proveedor`, 'success');
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  // =========================================================================
  // CONTROLADORES INTERACTIVOS Y TRANSACCIONES
  // =========================================================================

  function switchTab(tab) {
    activeTab = tab;
    window.MartelaUI.flashLoading('Cargando vista de compras...', 200);
    render(document.getElementById('contentContainer'));
  }

  function selectOrderAndTab(ocId, tab) {
    selectedOcId = parseInt(ocId, 10);
    activeTab = tab;
    window.MartelaUI.flashLoading('Cargando orden...', 220);
    render(document.getElementById('contentContainer'));
  }

  function handleSearch(val) {
    filterSearch = val;
    render(document.getElementById('contentContainer'));
  }

  function handleStatusFilter(val) {
    filterStatus = val;
    ordersPage = 1;
    render(document.getElementById('contentContainer'));
  }

  function handleSupplierStatementChange(val) {
    selectedSupplierId = parseInt(val, 10);
    statementsPage = 1;
    window.MartelaUI.flashLoading('Cargando estado de cuenta...', 200);
    render(document.getElementById('contentContainer'));
  }

  function handlePackingLineWeightChange(lineId, val) {
    const num = parseFloat(val) || 0;
    packingSimulatedVariances[lineId] = num;
  }

  async function simulatePackingTolerance(forceExcess) {
    const db = window.apiFacade._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === selectedOcId);
    if (!order) return;
    const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === order.id_oc);

    const packingRows = lines.map(l => {
      // Si forceExcess es true: simulamos +7.8% (excede el 5%)
      // Si forceExcess es false: simulamos +1.2% (dentro del 5%)
      const factor = forceExcess ? 1.078 : 1.012;
      const simulatedTotal = +(l.peso_teorico_total_g * factor).toFixed(4);
      return {
        id_linea: l.id_linea,
        peso_packing_total_g: simulatedTotal
      };
    });

    await window.MartelaUI.withLoading(
      forceExcess ? 'Simulando packing con sobrepeso fuera de tolerancia (+7.8%)...' : 'Simulando packing conciliado dentro de tolerancia (+1.2%)...',
      async () => {
        await window.apiFacade.auditPackingList(order.id_oc, packingRows);
        render(document.getElementById('contentContainer'));
      }
    );
  }

  async function approvePackingList(ocId) {
    await window.MartelaUI.withLoading('Aprobando packing list y avanzando a Cierre de Fix...', async () => {
      try {
        const db = window.apiFacade._getDB();
        const order = db.ordenes_compra.find(o => o.id_oc === ocId);
        const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === ocId);
        
        const packingRows = lines.map(l => ({
          id_linea: l.id_linea,
          peso_packing_total_g: l.peso_packing_total_g > 0 ? l.peso_packing_total_g : +(l.peso_teorico_total_g * 1.012).toFixed(4)
        }));

        const res = await window.apiFacade.auditPackingList(ocId, packingRows);
        if (!res.allValid) {
          window.MartelaUI.toast('No se puede aprobar: Existen partidas fuera de tolerancia (±5%)', 'error');
          return;
        }

        window.MartelaUI.toast('Packing List auditado y aprobado al 100%. Listo para Cierre de Fix.', 'success');
        activeTab = 'fix';
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  function recalcFixLiquidation() {
    const elFix = document.getElementById('inputFixGoldUsd');
    const elTc = document.getElementById('inputFixTc');
    if (!elFix || !elTc) return;

    const fixVal = parseFloat(elFix.value) || 2680.00;
    const tcVal = parseFloat(elTc.value) || 20.15;

    const gramoPuroUsd = fixVal / 31.1035;
    const g10k = gramoPuroUsd * 0.41667;
    const g14k = gramoPuroUsd * 0.58333;

    const l10 = document.getElementById('labelGramo10kUsd');
    const l14 = document.getElementById('labelGramo14kUsd');
    if (l10) l10.textContent = `$${g10k.toFixed(2)} USD / g`;
    if (l14) l14.textContent = `$${g14k.toFixed(2)} USD / g`;

    const db = window.apiFacade._getDB();
    const order = (db.ordenes_compra || []).find(o => o.id_oc === selectedOcId);
    if (!order) return;

    const lines = (db.orden_compra_lineas || []).filter(l => l.id_oc === order.id_oc);
    let metalUsd = 0;
    lines.forEach(line => {
      const pReal = line.peso_packing_total_g > 0 ? line.peso_packing_total_g : line.peso_teorico_total_g;
      const factor = line.kilataje === '10K' ? 0.41667 : (line.kilataje === '14K' ? 0.58333 : 0.925);
      metalUsd += pReal * gramoPuroUsd * factor;
    });

    const moUsd = order.costo_mo_total_estimado || 0;
    const totalUsd = metalUsd + moUsd;
    const totalMxn = totalUsd * tcVal;

    const bMetal = document.getElementById('boardMetalUsd');
    const bTotal = document.getElementById('boardTotalUsd');
    const bMxn = document.getElementById('boardTotalMxn');

    if (bMetal) bMetal.textContent = `$${metalUsd.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    if (bTotal) bTotal.textContent = `$${totalUsd.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
    if (bMxn) bMxn.textContent = `$${totalMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN`;
  }

  async function submitCloseFix(ocId) {
    const elFix = document.getElementById('inputFixGoldUsd');
    const elTc = document.getElementById('inputFixTc');
    const fixVal = parseFloat(elFix?.value) || 2680.00;
    const tcVal = parseFloat(elTc?.value) || 20.15;

    await window.MartelaUI.withLoading(`Congelando Fix a $${fixVal} USD y generando póliza de compra...`, async () => {
      try {
        const order = await window.apiFacade.closePurchaseFix(ocId, fixVal, tcVal);
        window.MartelaUI.toast(`¡Fix de Metal congelado! Orden ${order.folio_oc} liquidable por $${order.importe_total_liquidable} ${order.moneda}`, 'success');
        activeTab = 'transit';
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  async function saveLogistics(ocId) {
    const guia = document.getElementById('logGuia')?.value;
    const carrier = document.getElementById('logCarrier')?.value;
    const agent = document.getElementById('logAgent')?.value;
    const status = document.getElementById('logStatus')?.value;

    await window.MartelaUI.withLoading('Actualizando datos de rastreo aéreo...', async () => {
      try {
        await window.apiFacade.updatePurchaseLogistics(ocId, {
          transportista_aerolinea: carrier,
          guia_tracking: guia,
          agente_aduanal: agent,
          estatus_transito: status
        });
        window.MartelaUI.toast('Guía de seguimiento y estatus de aduana actualizados', 'success');
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  async function notifyArrival(ocId) {
    await window.MartelaUI.withLoading('Vinculando valija con el Módulo 2 de David Morales...', async () => {
      try {
        const res = await window.apiFacade.notifyArrivalToVault(ocId);
        window.MartelaUI.toast(`¡Valija arribada a MARTELA! Guía ${res.recepcion.guia_tracking} enviada al Módulo 2 para desempaque y video-inspección`, 'success');
        render(document.getElementById('contentContainer'));
      } catch (err) {
        window.MartelaUI.toast(err.message, 'error');
      }
    });
  }

  async function exportPurchasesExcel() {
    await window.MartelaUI.withLoading('Exportando órdenes de compra a Excel...', async () => {
      const db = window.apiFacade._getDB();
      const rows = (db.ordenes_compra || []).map(o => ({
        'Folio OC': o.folio_oc,
        'Proveedor': o.proveedor_nombre,
        'País': o.pais_origen,
        'Moneda': o.moneda,
        'Estatus': o.estatus,
        'Gramos Teóricos Oro': o.peso_oro_teorico_total_g,
        'Gramos Packing Real': o.peso_packing_total_g || 0,
        'Variación %': o.variacion_peso_total_pct || 0,
        'Mano de Obra Estimada': o.costo_mo_total_estimado,
        'Fix Cerrado USD': o.fix_oro_cerrado_usd || 'N/A',
        'Tipo Cambio': o.tipo_cambio_cerrado || 'N/A',
        'Importe Metal': o.importe_metal_total || 0,
        'Total Liquidable': o.importe_total_liquidable,
        'Fecha Emisión': o.fecha_emision,
        'Fecha Promesa': o.fecha_promesa_entrega
      }));

      window.MartelaUI.exportToExcel(rows, `martela-ordenes-compra-${new Date().toISOString().slice(0, 10)}.xlsx`, 'Ordenes_Compra');
    });
  }

  // =========================================================================
  // PAGINACIÓN HANDLERS CON FLASH LOADING
  // =========================================================================

  function goToOrdersPage(page) {
    ordersPage = page;
    window.MartelaUI.flashLoading('Cargando página de órdenes...', 180);
    render(document.getElementById('contentContainer'));
  }

  function setOrdersPageSize(size) {
    ordersPageSize = parseInt(size, 10);
    ordersPage = 1;
    window.MartelaUI.flashLoading('Ajustando registros por página...', 200);
    render(document.getElementById('contentContainer'));
  }

  function goToStatementsPage(page) {
    statementsPage = page;
    window.MartelaUI.flashLoading('Cargando página de movimientos...', 180);
    render(document.getElementById('contentContainer'));
  }

  function setStatementsPageSize(size) {
    statementsPageSize = parseInt(size, 10);
    statementsPage = 1;
    window.MartelaUI.flashLoading('Ajustando registros por página...', 200);
    render(document.getElementById('contentContainer'));
  }

  // =========================================================================
  // HELPERS VISUALES DE BADGES
  // =========================================================================

  function renderStatusBadge(status) {
    const map = {
      'BORRADOR': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300',
      'PROFORMA_PENDIENTE': 'bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold',
      'PACKING_AUDITADO': 'bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold',
      'PACKING_RECHAZADO': 'bg-rose-500/20 text-rose-600 border-rose-500/30 font-black animate-pulse',
      'FIX_CERRADO': 'bg-amber-500/10 text-amber-600 border-amber-500/20 font-bold',
      'PAGADO': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-bold',
      'EN_TRANSITO': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20 font-bold',
      'ENTREGADO_BOVEDA': 'bg-emerald-600 text-white font-bold'
    };
    const cls = map[status] || 'bg-slate-100 text-slate-600';
    return `<span class="px-2.5 py-1 rounded-full text-xs font-bold border ${cls}">${status}</span>`;
  }

  function renderToleranceBadge(pct, status) {
    if (status === 'EXCEDE_TOLERANCIA_MAX' || pct > 5.0) {
      return `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-rose-500 text-white animate-pulse">⚠️ EXCEDE (+${pct}%)</span>`;
    }
    if (status === 'BAJO_TOLERANCIA_MIN' || pct < -5.0) {
      return `<span class="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white">⚠️ BAJO PESO (${pct}%)</span>`;
    }
    if (status === 'DENTRO_RANGO' || (pct >= -5.0 && pct <= 5.0 && pct !== 0)) {
      return `<span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">✓ DENTRO (${pct > 0 ? '+' : ''}${pct}%)</span>`;
    }
    return `<span class="text-slate-500 text-xs font-semibold">Pendiente</span>`;
  }

  function renderMovementBadge(type) {
    const map = {
      'CARGO_COMPRA': 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
      'ANTICIPO_PAGADO': 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold',
      'LIQUIDACION_PAGADA': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold',
      'NOTA_CREDITO_DEFECTOS': 'bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold'
    };
    const cls = map[type] || 'bg-slate-100 text-slate-600';
    return `<span class="px-2.5 py-1 rounded text-xs font-bold ${cls}">${type}</span>`;
  }

  return {
    render,
    switchTab,
    selectOrderAndTab,
    handleSearch,
    handleStatusFilter,
    handleSupplierStatementChange,
    handlePackingLineWeightChange,
    simulatePackingTolerance,
    approvePackingList,
    recalcFixLiquidation,
    submitCloseFix,
    saveLogistics,
    notifyArrival,
    openNewOcModal,
    handleSaveNewOc,
    openPaymentModal,
    handleSavePayment,
    openCreditNoteModal,
    handleSaveCreditNote,
    exportPurchasesExcel,
    goToOrdersPage,
    setOrdersPageSize,
    goToStatementsPage,
    setStatementsPageSize
  };
})();

