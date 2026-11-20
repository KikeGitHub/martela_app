/**
 * MARTELA — MÓDULO 5 SDOP: Despiece B2B & Distribución Multi-Cliente
 * Pestaña 1: Coppel B2B (Carga de pedido semanal .xlsx, surtido inteligente FIFO 26 CEDIS y descuento de stock)
 * Pestaña 2: Montepío Luz Saviñón / MLS (Armado de lotes, Layout 16 cols exactas, Oro Fino / Margen 70% y Remisiones con Sello)
 * Pestaña 3: Mayoristas & Boutiques (Venta libre por SKU, cotización en tiempo real y remisiones comerciales directas)
 * Incluye directivas de seguridad y adaptación visual según el Rol Operativo (RBAC).
 */
window.MartelaCoppel = (function() {
  let currentClientTab = 'coppel'; // 'coppel' | 'montepio' | 'mayoristas'
  const expandedBranches = new Set();
  let coppelPage = 1;
  let coppelPageSize = 20;
  let mlsPiecesPage = 1;
  let mlsPiecesPageSize = 20;
  let mlsRemisionesPage = 1;
  let mlsRemisionesPageSize = 20;
  let wsCartPage = 1;
  let wsCartPageSize = 20;

  // Estado reactivo para Montepío Luz Saviñón
  let mlsConfig = {
    selectedCentro: '3032',
    tipoMetal: 'ORO_10K', // 'PLATA_925' | 'ORO_10K' | 'ORO_14K'
    selectedPieceIds: new Set(),
    folioSello: 'Z008340',
    pesoBolsa: 1149.00,
    facturaSae: 'SAE-F-90812'
  };

  // Estado reactivo para Mayoristas & Boutiques
  let wholesaleConfig = {
    selectedClientId: 'CLI-002',
    selectedSku: '07502278209688',
    cantidad: 6,
    margenPct: 30,
    cartItems: [
      {
        sku: "07502278209688",
        modelo: "MRT-AN-1042",
        descripcion: "Anillo Solitario Imperial CZ Oro 10K",
        quilataje: "10K",
        cantidad: 6,
        peso_unit_g: 2.20,
        costo_unit: 1485.00,
        margen_pct: 30,
        precio_unit: 1930.50,
        subtotal: 11583.00
      }
    ]
  };

  const MLS_CENTROS = [
    { id: '3032', nombre: '3032 Cancún Boutique', zona: 'Sureste (Q. Roo)', selloDefecto: 'Z008340', saeDefecto: 'SAE-F-90812', pesoDefecto: 1149.00 },
    { id: '3050', nombre: '3050 Santa Fe Avant', zona: 'Poniente CDMX', selloDefecto: 'Z008341', saeDefecto: 'SAE-F-90813', pesoDefecto: 890.50 },
    { id: '4015', nombre: '4015 Ecatepec Vía Morelos', zona: 'Norte / Oriente (Edo. Méx.)', selloDefecto: 'Z008342', saeDefecto: 'SAE-F-90814', pesoDefecto: 1210.00 },
    { id: '4031', nombre: '4031 Texcoco Catedral', zona: 'Oriente (Edo. Méx.)', selloDefecto: 'Z008343', saeDefecto: 'SAE-F-90815', pesoDefecto: 985.20 }
  ];

  async function render(container) {
    const orders = await window.apiFacade.getCoppelOrders();
    const activeOrder = orders[0] || { sucursales: [] };
    const db = window.apiFacade._getDB();
    const user = window.MartelaAuth.getCurrentUser();
    const clientMls = (db.clients || []).find(c => c.id === 'CLI-004' || (c.nombre || '').includes('Montepío')) || { saldo_oro_fino_g: 145.80000 };
    const availablePieces = (db.inventory_pieces || []).filter(p => p.estatus === 'DISPONIBLE');
    const { esc } = window.MartelaUI;

    container.innerHTML = `
      <!-- Encabezado Módulo 5 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-4">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">MÓDULO DE DISTRIBUCIÓN</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Despiece B2B &amp; Clientes Mayoristas</h1>
        </div>
        
        <!-- Saldo Cuenta Maquila MLS Header Widget -->
        <div class="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-2 flex items-center gap-3">
          <div class="text-2xl">🏛️</div>
          <div>
            <div class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Cuenta Maquila Montepío (MLS)</div>
            <div class="text-sm font-mono font-black text-slate-900 dark:text-white">
              ${Number(clientMls.saldo_oro_fino_g || 145.8).toFixed(5)} <span class="text-xs font-bold text-amber-600">g Au 24K</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Banner de Seguridad Contextual RBAC -->
      ${renderRbacBadge(user)}

      <!-- Stepper / Selector Visual de 3 Canales B2B -->
      <div class="mb-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#e9ebef] dark:bg-slate-800/80 border border-[#d9dde3] dark:border-slate-700 shadow-sm">
          <button 
            id="tabBtnCoppel"
            onclick="MartelaCoppel.switchClientTab('coppel')" 
            class="flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${currentClientTab === 'coppel' ? 'bg-[#b5851d] text-white font-bold shadow-sm border border-[#996e16] ring-2 ring-[#b5851d]/25' : 'bg-[#f8f9fa] dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-[#b5851d]/50 border border-[#d9dde3] dark:border-slate-700/60'}"
          >
            <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${currentClientTab === 'coppel' ? 'bg-[#242d3d] text-[#e8dcbe]' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">1</span>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>🏢</span> Canal Coppel B2B
              </div>
              <div class="text-[11px] ${currentClientTab === 'coppel' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'} font-normal truncate">
                Excel Semanal &amp; Surtido FIFO
              </div>
            </div>
          </button>

          <button 
            id="tabBtnMontepio"
            onclick="MartelaCoppel.switchClientTab('montepio')" 
            class="flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${currentClientTab === 'montepio' ? 'bg-[#b5851d] text-white font-bold shadow-sm border border-[#996e16] ring-2 ring-[#b5851d]/25' : 'bg-[#f8f9fa] dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-[#b5851d]/50 border border-[#d9dde3] dark:border-slate-700/60'}"
          >
            <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${currentClientTab === 'montepio' ? 'bg-[#242d3d] text-[#e8dcbe]' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">2</span>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>🏛️</span> Montepío MLS
              </div>
              <div class="text-[11px] ${currentClientTab === 'montepio' ? 'text-amber-100' : 'text-slate-500 dark:text-slate-400'} font-normal truncate">
                Layout 16 Cols &amp; Oro Fino
              </div>
            </div>
          </button>

          <button 
            id="tabBtnMayoristas"
            onclick="MartelaCoppel.switchClientTab('mayoristas')" 
            class="flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left ${currentClientTab === 'mayoristas' ? 'bg-[#b5851d] text-white font-bold shadow-sm border border-[#996e16] ring-2 ring-[#b5851d]/25' : 'bg-[#f8f9fa] dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:border-[#b5851d]/50 border border-[#d9dde3] dark:border-slate-700/60'}"
          >
            <span class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 ${currentClientTab === 'mayoristas' ? 'bg-[#242d3d] text-[#e8dcbe]' : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}">3</span>
            <div class="min-w-0 flex-1">
              <div class="text-xs font-bold leading-tight flex items-center gap-1.5">
                <span>🏬</span> Mayoristas Libres
              </div>
              <div class="text-[11px] ${currentClientTab === 'mayoristas' ? 'text-slate-900/80' : 'text-slate-400 dark:text-slate-500'} font-normal truncate">
                Venta Libre &amp; Remisión Directa
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Contenedor Dinámico de la Pestaña Activa -->
      <div id="clientTabContent">
        ${currentClientTab === 'coppel' 
          ? renderCoppelTab(activeOrder, availablePieces.length, db, user)
          : currentClientTab === 'montepio'
            ? renderMontepioTab(clientMls, availablePieces, db, user)
            : renderWholesaleTab(db, availablePieces, user)}
      </div>
    `;
  }

  function renderRbacBadge(user) {
    if (user.key === 'boveda') {
      return `
        <div class="mb-4 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-blue-800 dark:text-blue-300">
            <span class="font-bold">⚖️ Elisa Ramírez (Almacén / Bóveda):</span>
            <span>Habilitado surtido físico, pesaje y sellos de valija. Facturas fiscales SAE en modo lectura.</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">RBAC: BOVEDA_OPERATOR</span>
        </div>
      `;
    }
    if (user.key === 'finanzas') {
      return `
        <div class="mb-4 px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex items-center justify-between text-xs">
          <div class="flex items-center gap-2 text-purple-800 dark:text-purple-300">
            <span class="font-bold">◇ Adriana López (Finanzas / PLD):</span>
            <span>Habilitada edición de Facturas SAE, recálculo del FIX del día y auditoría de Oro Fino Puro 24K.</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-purple-500/20 text-purple-700 dark:text-purple-300 font-mono text-[10px] font-bold">RBAC: FINANCE_OFFICER</span>
        </div>
      `;
    }
    return `
      <div class="mb-4 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2 text-amber-800 dark:text-amber-300">
          <span class="font-bold">👑 Carlos Mendoza (Dirección General):</span>
          <span>Control Total Maestro: Surtido B2B, Fijación de Márgenes, Facturación SAE y Débitos de Oro Fino.</span>
        </div>
        <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 font-mono text-[10px] font-bold">RBAC: FULL_ADMIN</span>
      </div>
    `;
  }

  function switchClientTab(tab) {
    currentClientTab = tab;
    render(document.getElementById('contentContainer'));
  }

  // =========================================================================
  // SUB-VISTA 1: COPPEL B2B (CARGA SEMANAL, SURTIDO AUTOMÁTICO Y DESCUENTO)
  // =========================================================================
  function renderCoppelTab(activeOrder, availablePiecesCount, db, user) {
    const { esc, badge } = window.MartelaUI;
    const isAssigned = (activeOrder.piezas_asignadas || 0) >= (activeOrder.total_piezas || 1);
    const isDispatched = activeOrder.estatus === 'DESPACHADO';
    const matchPercentage = (((activeOrder.piezas_asignadas || 0) / (activeOrder.total_piezas || 1)) * 100).toFixed(0);

    return `
      <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 class="text-lg font-bold text-slate-900 dark:text-white">Flujo Inbound: Carga de Pedido Semanal Coppel</h2>
          <p class="text-xs text-slate-400">Archivo descargado los miércoles del portal B2B para consolidación en 26 sucursales.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="MartelaCoppel.exportLayoutExcel16Cols('${activeOrder.order_id}')" class="btn btn-soft text-xs" title="Descargar archivo Excel con 16 columnas oficiales">
            <span>📊</span> Descargar Layout Oficial 16 Cols (.xlsx)
          </button>
          <button onclick="MartelaCoppel.openRemisionPdfModal('${activeOrder.order_id}', '${activeOrder.sucursales[0]?.tienda_id}')" class="btn btn-soft text-xs">
            <span>📄</span> Imprimir Remisión con Sello (.pdf)
          </button>
          ${!isAssigned ? `
            <button onclick="MartelaCoppel.assignPieces('${activeOrder.order_id}')" class="btn btn-gold text-xs font-bold" id="btnAssignPieces">
              <span>⚡</span> Asignar 438 Sub-piezas Automáticamente
            </button>
          ` : !isDispatched ? `
            <button onclick="MartelaCoppel.confirmAndDeduct('${activeOrder.order_id}')" class="btn bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md">
              <span>🔒</span> Confirmar Despacho y Descontar Inventario
            </button>
            <button onclick="MartelaApp.switchTab('logistics')" class="btn btn-gold text-xs">
              <span>🚚</span> Despachar a Ruta Logística PWA &amp; PLD
            </button>
          ` : `
            <button onclick="MartelaApp.switchTab('logistics')" class="btn btn-gold text-xs">
              <span>🚚</span> Despachar a Ruta Logística PWA &amp; PLD
            </button>
          `}
        </div>
      </div>

      <!-- Zona Drag & Drop Coppel -->
      <div class="panel p-5 mb-6 border-dashed border-2 border-slate-300 dark:border-slate-700 hover:border-amber-500/80 transition-all bg-slate-50/60 dark:bg-slate-900/40">
        <div class="flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl flex-shrink-0">
              📂
            </div>
            <div>
              <div class="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Carga Semanal de Pedido Coppel (.xlsx / .csv)
              </div>
              <div class="text-[11px] text-slate-400">
                Arrastra aquí el archivo descargado los miércoles del portal de proveedores de Coppel, o usa el archivo demo pre-cargado.
              </div>
            </div>
          </div>
          
          <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
            <input 
              type="file" 
              id="coppelExcelFileInput" 
              accept=".xlsx,.xls,.csv" 
              class="hidden" 
              onchange="MartelaCoppel.handleFileSelect(event)" 
            />
            <button onclick="document.getElementById('coppelExcelFileInput').click()" class="btn btn-soft text-xs py-2 px-3">
              <span>📎</span> Seleccionar Archivo (.xlsx)
            </button>
            <button onclick="MartelaCoppel.handleDemoFileLoad()" class="btn btn-gold text-xs py-2 px-3.5 shadow-sm" title="Simula la carga inmediata del archivo consolidado semanal con 26 sucursales">
              <span>⚡</span> Cargar Archivo Demo Oficial Coppel (W46)
            </button>
          </div>
        </div>

        <div id="uploadProgressBarContainer" class="hidden mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
          <div class="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
            <span id="uploadProgressLabel">Leyendo y validando estructura de columnas...</span>
            <span id="uploadProgressPct">0%</span>
          </div>
          <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div id="uploadProgressBar" class="bg-amber-500 h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
          </div>
        </div>
      </div>

      <!-- Tarjetas KPI Coppel -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="panel p-4 bg-slate-50/70 dark:bg-slate-900/60">
          <div class="text-[10px] uppercase font-bold text-slate-400">Piezas Solicitadas Coppel</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">
            ${activeOrder.total_piezas || 438} <span class="text-xs font-normal text-slate-400">pzs</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">26 Centros Logísticos</div>
        </div>

        <div class="panel p-4 bg-slate-50/70 dark:bg-slate-900/60">
          <div class="text-[10px] uppercase font-bold text-slate-400">Piezas Asignadas (Surtidas)</div>
          <div class="text-2xl font-black ${isAssigned ? 'text-emerald-500' : 'text-amber-500'} mt-1">
            ${activeOrder.piezas_asignadas || 0} <span class="text-xs font-normal text-slate-400">/ ${activeOrder.total_piezas || 438}</span>
          </div>
          <div class="text-[10px] ${isAssigned ? 'text-emerald-600 font-semibold' : 'text-slate-400'} mt-0.5">
            ${isAssigned ? 'Conciliación 100% OK' : 'Pendiente de Surtido'}
          </div>
        </div>

        <div class="panel p-4 bg-slate-50/70 dark:bg-slate-900/60">
          <div class="text-[10px] uppercase font-bold text-slate-400">Existencias Físicas en Bóveda</div>
          <div class="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            ${availablePiecesCount} <span class="text-xs font-normal text-slate-400">disponibles</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-0.5">Gavetas R1, R2 y R3</div>
        </div>

        <div class="panel p-4 bg-slate-50/70 dark:bg-slate-900/60">
          <div class="text-[10px] uppercase font-bold text-slate-400">Estatus del Pedido</div>
          <div class="mt-1">
            ${isDispatched ? badge('DESPACHADO') : isAssigned ? badge('CONCILIADO_100') : badge('CARGADO')}
          </div>
          <div class="text-[10px] font-mono text-slate-400 mt-1">
            Sello: <b>${esc(activeOrder.sello_seguridad_bolsa || 'Z008340')}</b>
          </div>
        </div>
      </div>

      <!-- Barra de Conciliación Coppel -->
      <div class="panel p-5 mb-6 border-l-4 ${isDispatched ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-950/20' : isAssigned ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'}">
        <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-bold text-base text-slate-900 dark:text-white">${esc(activeOrder.order_id)}</span>
              ${badge(activeOrder.estatus)}
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                🔒 SELLO MAESTRO: FOLIO ${esc(activeOrder.sello_seguridad_bolsa || 'Z008340')}
              </span>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300">
                FACTURA SAE: ${esc(activeOrder.factura_sae || 'SAE-F-90812')}
              </span>
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
              ${esc(activeOrder.notas)} · Archivo origen: <b>${esc(activeOrder.archivo_origen_nombre || 'Coppel_Pedido_Semanal.xlsx')}</b>
            </div>
          </div>

          <div class="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div class="text-right">
              <div class="text-[10px] uppercase font-bold text-slate-400">Conciliación de Despiece B2B</div>
              <div class="text-base font-black text-slate-900 dark:text-white">
                Solicitadas: <b>${activeOrder.total_piezas}</b> | Asignadas: <b class="${isAssigned ? 'text-emerald-500' : 'text-amber-500'}">${activeOrder.piezas_asignadas}</b>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black ${isAssigned ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}">
              ${matchPercentage}%
            </div>
          </div>
        </div>
      </div>

      <!-- Tabla Coppel con Acordeón por Centro Logístico -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">Mesa de Despiece y Acordeón por Centro Logístico (${activeOrder.sucursales.length} CEDIS)</h3>
            <p class="text-xs text-slate-400">Despliega cualquier sucursal para verificar los números de serie físicos asignados (PZ-2026-XXXX) con su peso neto analítico.</p>
          </div>
          <span class="text-xs text-slate-500 font-mono">${activeOrder.total_piezas} piezas en pedido</span>
        </div>

        <div class="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0 z-10">
              <tr>
                <th class="p-3">Centro Logístico</th>
                <th class="p-3">Sucursal / Destino</th>
                <th class="p-3 text-center">Caja</th>
                <th class="p-3 text-center">Folio Sello Bolsa</th>
                <th class="p-3 text-center">Factura SAE</th>
                <th class="p-3 text-center">Piezas</th>
                <th class="p-3 text-center">Estatus</th>
                <th class="p-3 text-center">Despiece</th>
                <th class="p-3 text-center">Acciones de Salida</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${(() => {
                const copPag = window.MartelaUI.paginate(activeOrder.sucursales, coppelPage, coppelPageSize);
                return copPag.items.map(s => {
                  const isExpanded = expandedBranches.has(s.tienda_id);
                  const assignedCount = (s.piezas_asignadas_ids || []).length;
                  const isBranchFull = assignedCount === s.piezas_solicitadas;
                  const branchPieces = (db.inventory_pieces || []).filter(p => (s.piezas_asignadas_ids || []).includes(p.piece_id));

                  return `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td class="p-3 font-mono font-bold text-amber-600 dark:text-amber-400">${esc(s.numero_sucursal || s.tienda_id)}</td>
                      <td class="p-3">
                        <div class="font-semibold text-slate-900 dark:text-white">${esc(s.nombre)}</div>
                        <div class="text-[10px] text-slate-400">CEDIS: ${esc(s.cedis)} · Zona: ${esc(s.zona)}</div>
                      </td>
                      <td class="p-3 text-center">
                        <span class="font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          Caja #${s.caja_sugerida}
                        </span>
                      </td>
                      <td class="p-3 text-center">
                        <span class="font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          FOLIO: ${esc(s.sello_seguridad_bolsa || 'Z008340')}
                        </span>
                      </td>
                      <td class="p-3 text-center font-mono text-slate-600 dark:text-slate-300">
                        ${esc(s.factura_sae || 'SAE-F-90812')}
                      </td>
                      <td class="p-3 text-center font-bold">
                        <span class="${isBranchFull ? 'text-emerald-500' : 'text-amber-500'}">
                          ${assignedCount}
                        </span> / ${s.piezas_solicitadas}
                      </td>
                      <td class="p-3 text-center">
                        ${isDispatched ? badge('DESPACHADO') : isBranchFull ? badge('LISTO_EMPAQUE') : badge('PENDIENTE')}
                      </td>
                      <td class="p-3 text-center">
                        <button 
                          onclick="MartelaCoppel.toggleBranchAccordion('${s.tienda_id}')"
                          class="btn btn-soft text-[11px] py-1 px-2.5 font-mono"
                          title="Ver detalle de piezas físicas individuales"
                        >
                          ${isExpanded ? '▲ Ocultar' : '▼ Ver Piezas'} (${assignedCount})
                        </button>
                      </td>
                      <td class="p-3 text-center">
                        <div class="flex flex-wrap items-center justify-center gap-2">
                          <button
                            onclick="MartelaCoppel.openRemisionPdfModal('${activeOrder.order_id}', '${s.tienda_id}')"
                            class="text-amber-600 dark:text-amber-400 font-bold hover:underline"
                            title="Ver e Imprimir Hoja de Remisión con Sello"
                          >
                            📄 Remisión PDF
                          </button>
                          <button
                            onclick="MartelaCoppel.exportLayoutExcel16Cols('${activeOrder.order_id}', '${s.tienda_id}')"
                            class="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                            title="Descargar Layout Excel 16 Columnas de esta sucursal"
                          >
                            📊 .xlsx
                          </button>
                          <button
                            onclick="MartelaCoppel.openEditSealModal('${activeOrder.order_id}', '${s.tienda_id}')"
                            class="text-slate-400 hover:text-slate-900 dark:hover:text-white"
                            title="Configurar Sello de Bolsa y Peso Verificado"
                          >
                            🔒 Sello
                          </button>
                        </div>
                      </td>
                    </tr>

                    ${isExpanded ? `
                      <tr class="bg-slate-50 dark:bg-slate-900/70 border-b-2 border-amber-500/40">
                        <td colspan="9" class="p-4">
                          <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-inner">
                            <div class="flex justify-between items-center mb-3">
                              <div>
                                <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                                  Despiece Físico Asignado — ${esc(s.numero_sucursal || s.tienda_id)} (${esc(s.nombre)})
                                </span>
                                <span class="text-[11px] text-slate-400 block">
                                  Caja #${s.caja_sugerida} · Folio de Sello Plástico: <b class="text-emerald-600 font-mono">${esc(s.sello_seguridad_bolsa || 'Z008340')}</b>
                                </span>
                              </div>
                              <span class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                                ${branchPieces.length} piezas físicas asignadas
                              </span>
                            </div>

                            ${branchPieces.length > 0 ? `
                              <div class="overflow-x-auto max-h-48 overflow-y-auto">
                                <table class="w-full text-left text-[11px] font-mono">
                                  <thead class="bg-slate-100 dark:bg-slate-700 text-slate-500 uppercase sticky top-0">
                                    <tr>
                                      <th class="p-1.5">ID Pieza</th>
                                      <th class="p-1.5">SKU 14</th>
                                      <th class="p-1.5">Modelo</th>
                                      <th class="p-1.5 text-right">Bruto (g)</th>
                                      <th class="p-1.5 text-right">CZ (g)</th>
                                      <th class="p-1.5 text-right font-bold text-amber-600">Neto (g)</th>
                                      <th class="p-1.5 text-center">Gaveta Origen</th>
                                      <th class="p-1.5 text-center">Estatus</th>
                                    </tr>
                                  </thead>
                                  <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                                    ${branchPieces.map(p => `
                                      <tr>
                                        <td class="p-1.5 font-bold text-amber-600 dark:text-amber-400">${esc(p.piece_id)}</td>
                                        <td class="p-1.5">${esc(p.sku_ref)}</td>
                                        <td class="p-1.5">${esc(p.modelo || 'MRT-AN-1042')}</td>
                                        <td class="p-1.5 text-right">${Number(p.peso_bruto_g || 2.38).toFixed(4)}g</td>
                                        <td class="p-1.5 text-right text-slate-400">${Number(p.peso_piedra_g || 0.18).toFixed(4)}g</td>
                                        <td class="p-1.5 text-right font-bold text-slate-900 dark:text-white">${Number(p.peso_neto_g || 2.20).toFixed(4)}g</td>
                                        <td class="p-1.5 text-center text-slate-400">${esc(p.drawer_id || 'BOVEDA-R1-N2-G05')}</td>
                                        <td class="p-1.5 text-center">
                                          <span class="px-1.5 py-0.5 rounded text-[10px] ${p.estatus === 'DESPACHADO_COPPEL' ? 'bg-blue-500/20 text-blue-600' : 'bg-emerald-500/20 text-emerald-600 font-bold'}">
                                            ${esc(p.estatus)}
                                          </span>
                                        </td>
                                      </tr>
                                    `).join('')}
                                  </tbody>
                                </table>
                              </div>
                            ` : `
                              <div class="py-4 text-center text-slate-400 text-xs">
                                Esta sucursal aún no tiene piezas físicas asignadas. Haz clic en <b>"⚡ Asignar 438 Sub-piezas Automáticamente"</b> para ejecutar el surtido FIFO desde bóveda.
                              </div>
                            `}
                          </div>
                        </td>
                      </tr>
                    ` : ''}
                  `;
                }).join('');
              })()}
            </tbody>
          </table>
        </div>
        ${(() => {
          const copPag = window.MartelaUI.paginate(activeOrder.sucursales, coppelPage, coppelPageSize);
          return window.MartelaUI.renderPaginationControls({
            totalItems: copPag.totalItems,
            currentPage: copPag.currentPage,
            pageSize: copPag.pageSize,
            totalPages: copPag.totalPages,
            startIdx: copPag.startIdx,
            endIdx: copPag.endIdx,
            onPageChange: 'MartelaCoppel.goToCoppelPage',
            onPageSizeChange: 'MartelaCoppel.setCoppelPageSize',
            itemName: 'sucursales / CEDIS Coppel'
          });
        })()}
      </div>
    `;
  }

  // =========================================================================
  // SUB-VISTA 2: MONTEPÍO LUZ SAVIÑÓN / MLS (OUTBOUND: 16 COLS & ORO FINO / 70%)
  // =========================================================================
  function renderMontepioTab(clientMls, availablePieces, db, user) {
    const { esc, money } = window.MartelaUI;
    const centro = MLS_CENTROS.find(c => c.id === mlsConfig.selectedCentro) || MLS_CENTROS[0];
    const isPlata = mlsConfig.tipoMetal === 'PLATA_925';
    const isBoveda = user.key === 'boveda';

    const selectedPieces = availablePieces.filter(p => mlsConfig.selectedPieceIds.has(p.piece_id));
    const pieceCount = selectedPieces.length;

    const totalBruto = selectedPieces.reduce((acc, p) => acc + Number(p.peso_bruto_g || 2.0), 0);
    const totalNeto = selectedPieces.reduce((acc, p) => acc + Number(p.peso_neto_g || 1.8), 0);
    
    const factorOroFino = isPlata ? 0 : (mlsConfig.tipoMetal === 'ORO_14K' ? 0.58333 : 0.41667);
    const totalOroFinoG = +(totalNeto * factorOroFino).toFixed(5);

    const rates = db.metal_rates || { fix_oro_hoy_usd: 2680, tipo_cambio_usd_mxn: 18.25, costo_gramo_plata_mxn: 24.80 };
    const gramoOroFinoMxn = +(rates.fix_oro_hoy_usd * rates.tipo_cambio_usd_mxn / 31.1035).toFixed(2);
    const costoGramoMetal = isPlata ? rates.costo_gramo_plata_mxn : +(gramoOroFinoMxn * factorOroFino).toFixed(2);
    
    const costoManoObraTotal = selectedPieces.reduce((acc, p) => {
      const prod = db.products_sku.find(x => x.sku === p.sku_ref);
      return acc + Number(prod?.costo_mo_base || 185.00);
    }, 0);
    const costoMetalTotal = +(totalNeto * costoGramoMetal).toFixed(2);
    const totalMartela = +(costoManoObraTotal + costoMetalTotal).toFixed(2);
    const margenMls70 = +(totalMartela * 0.70).toFixed(2);
    const totalPublicoConIva = +((totalMartela + margenMls70) * 1.16).toFixed(2);

    const remisionesMls = db.salidas_remisiones_mls || [];

    return `
      <div class="space-y-6">
        <!-- Barra de Configuración de Lote MLS -->
        <div class="panel p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl shadow-xl">
          <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5 border-b border-slate-700/60 pb-4">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-slate-900">MONTEPÍO LUZ SAVIÑÓN</span>
                <span class="text-xs text-slate-400 font-mono">RFC: MLS020815AA1 · I.A.P.</span>
              </div>
              <h2 class="text-xl font-black mt-1">Armado de Lote y Generación de Layout Oficial 16 Columnas</h2>
              <p class="text-xs text-slate-300">
                Selecciona la sucursal de destino y la regla de precio para fijar el costo de vitrina y el débito de oro fino.
              </p>
            </div>
            
            <div class="flex flex-wrap items-center gap-2">
              <button 
                onclick="MartelaCoppel.preselectSuggestedMlsBatch()" 
                class="btn btn-gold text-xs font-bold"
                title="Carga automáticamente 17 piezas disponibles en bóveda con las especificaciones del metal seleccionado"
              >
                <span>⚡</span> Armar Lote Sugerido (${mlsConfig.tipoMetal})
              </button>
              <button 
                onclick="MartelaCoppel.exportMlsLayout16Cols()" 
                class="btn btn-soft text-xs font-bold text-slate-900 bg-white hover:bg-slate-100"
                ${pieceCount === 0 ? 'disabled' : ''}
              >
                <span>📊</span> Descargar Layout 16 Cols (.xlsx)
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                1. Centro Logístico / Sucursal MLS:
              </label>
              <select 
                class="bg-slate-950 text-white border-slate-700 rounded-xl text-xs font-bold"
                onchange="MartelaCoppel.handleMlsCentroChange(this.value)"
              >
                ${MLS_CENTROS.map(c => `
                  <option value="${c.id}" ${c.id === mlsConfig.selectedCentro ? 'selected' : ''}>
                    ${c.nombre} (${c.zona})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                2. Metal &amp; Fórmula Comercial:
              </label>
              <select 
                class="bg-slate-950 text-white border-slate-700 rounded-xl text-xs font-bold"
                onchange="MartelaCoppel.handleMlsMetalChange(this.value)"
              >
                <option value="ORO_10K" ${mlsConfig.tipoMetal === 'ORO_10K' ? 'selected' : ''}>Oro 10K (Bipartita M.O. + Fix Oro Fino 0.41667)</option>
                <option value="ORO_14K" ${mlsConfig.tipoMetal === 'ORO_14K' ? 'selected' : ''}>Oro 14K (Bipartita M.O. + Fix Oro Fino 0.58333)</option>
                <option value="PLATA_925" ${mlsConfig.tipoMetal === 'PLATA_925' ? 'selected' : ''}>Plata .925 (Margen Retail 70% + 16% IVA)</option>
              </select>
            </div>

            <div class="bg-slate-950/80 p-3 rounded-xl border border-slate-700/80 text-xs flex flex-col justify-between">
              <div class="text-[10px] text-slate-400 font-bold uppercase">Impacto Financiero de la Regla:</div>
              <div class="text-[11px] text-amber-300 font-semibold mt-1">
                ${isPlata 
                  ? 'Fórmula Plata: Costo Martela × 1.70 (Margen MLS) + 16% IVA'
                  : `Bipartita: M.O. + Fix $${rates.fix_oro_hoy_usd} USD · Débito Cuenta Maquila: ${factorOroFino} g Au/g`}
              </div>
            </div>
          </div>
        </div>

        <!-- Métricas del Lote Seleccionado -->
        <div class="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div class="panel p-3.5 bg-slate-50/70 dark:bg-slate-900/60">
            <div class="text-[10px] uppercase font-bold text-slate-400">Piezas en Lote</div>
            <div class="text-xl font-black text-slate-900 dark:text-white mt-0.5">
              ${pieceCount} <span class="text-xs font-normal text-slate-400">pzs</span>
            </div>
          </div>

          <div class="panel p-3.5 bg-slate-50/70 dark:bg-slate-900/60">
            <div class="text-[10px] uppercase font-bold text-slate-400">Peso Bruto / Neto</div>
            <div class="text-xs font-black font-mono text-slate-900 dark:text-white mt-1">
              ${totalBruto.toFixed(2)}g / <span class="text-amber-600">${totalNeto.toFixed(2)}g</span>
            </div>
          </div>

          <div class="panel p-3.5 bg-slate-50/70 dark:bg-slate-900/60">
            <div class="text-[10px] uppercase font-bold text-slate-400">Oro Fino a Debitar (24K)</div>
            <div class="text-sm font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
              ${totalOroFinoG.toFixed(5)} <span class="text-[10px]">g Au</span>
            </div>
          </div>

          <div class="panel p-3.5 bg-slate-50/70 dark:bg-slate-900/60">
            <div class="text-[10px] uppercase font-bold text-slate-400">Costo Base Martela</div>
            <div class="text-sm font-black text-slate-900 dark:text-white mt-1">
              ${money(totalMartela)}
            </div>
          </div>

          <div class="panel p-3.5 bg-slate-50/70 dark:bg-slate-900/60">
            <div class="text-[10px] uppercase font-bold text-slate-400">Margen MLS (70%)</div>
            <div class="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">
              ${money(margenMls70)}
            </div>
          </div>

          <div class="panel p-3.5 bg-slate-50/70 dark:bg-slate-900/60 border border-amber-500/30">
            <div class="text-[10px] uppercase font-bold text-amber-600">Público con IVA</div>
            <div class="text-sm font-black text-slate-900 dark:text-white mt-1">
              ${money(totalPublicoConIva)}
            </div>
          </div>
        </div>

        <!-- Formulario de Empaque, Sello Inviolable y Báscula Verificada -->
        <div class="panel p-5 bg-amber-50/30 dark:bg-amber-950/20 border-l-4 border-amber-500">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <div class="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Control de Seguridad Física y Verificación de Báscula c/Bolsa
              </div>
              <div class="text-[11px] text-slate-500">
                Datos requeridos para la Hoja Oficial de Salida y la inspección en recepción de tienda.
              </div>
            </div>
            <div class="flex gap-2">
              <button onclick="MartelaCoppel.openMlsRemisionPdfModal()" class="btn btn-soft text-xs" ${pieceCount === 0 ? 'disabled' : ''}>
                <span>📄</span> Vista Previa Remisión PDF
              </button>
              <button onclick="MartelaCoppel.confirmAndExecuteMlsDispatch()" class="btn btn-gold text-xs font-bold" ${pieceCount === 0 ? 'disabled' : ''}>
                <span>🔒</span> Confirmar Salida y Debitar Maquila/Stock
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Folio Sello de Seguridad Plástico (Valija):
              </label>
              <input 
                id="mlsFolioSelloInput" 
                value="${esc(mlsConfig.folioSello)}" 
                oninput="MartelaCoppel.handleMlsFieldChange('folioSello', this.value)" 
                class="font-mono font-bold text-emerald-600 uppercase"
                placeholder="Ej. Z008340"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Peso Bruto Verificado c/Bolsa en Báscula (g):
              </label>
              <input 
                id="mlsPesoBolsaInput" 
                type="number" 
                step="0.01" 
                value="${mlsConfig.pesoBolsa}" 
                oninput="MartelaCoppel.handleMlsFieldChange('pesoBolsa', parseFloat(this.value))" 
                class="font-mono font-bold"
                placeholder="1149.00"
              />
            </div>
            <div>
              <label class="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
                Factura SAE Asociada a Montepío:
              </label>
              ${isBoveda ? `
                <div class="relative">
                  <input value="${esc(mlsConfig.facturaSae)}" disabled class="font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-80" />
                  <span class="text-[10px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5 block">🔒 Gestionado por Finanzas (Adriana)</span>
                </div>
              ` : `
                <input 
                  id="mlsFacturaSaeInput" 
                  value="${esc(mlsConfig.facturaSae)}" 
                  oninput="MartelaCoppel.handleMlsFieldChange('facturaSae', this.value)" 
                  class="font-mono"
                  placeholder="SAE-F-90812"
                />
              `}
            </div>
          </div>
        </div>

        <!-- Tabla Interactiva de Selección de Piezas de Bóveda -->
        <div class="panel overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Selección de Piezas Físicas en Bóveda para el Lote MLS (${centro.nombre})
              </h3>
              <p class="text-[11px] text-slate-400">
                Marca o desmarca las piezas a incluir en este embarque. Mostrando piezas con estatus DISPONIBLE.
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button onclick="MartelaCoppel.toggleSelectAllMlsPieces(true)" class="btn btn-soft text-[11px] py-1 px-2.5">
                Seleccionar Todas
              </button>
              <button onclick="MartelaCoppel.toggleSelectAllMlsPieces(false)" class="btn btn-soft text-[11px] py-1 px-2.5">
                Limpiar Selección
              </button>
            </div>
          </div>

          <div class="overflow-x-auto max-h-80 overflow-y-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0 font-mono text-[11px]">
                <tr>
                  <th class="p-2.5 text-center w-10">Incluir</th>
                  <th class="p-2.5">Serial Físico</th>
                  <th class="p-2.5">SKU 14</th>
                  <th class="p-2.5">Modelo Martela</th>
                  <th class="p-2.5">Tipo Metal</th>
                  <th class="p-2.5 text-right">Peso Bruto</th>
                  <th class="p-2.5 text-right">Tara CZ</th>
                  <th class="p-2.5 text-right font-bold text-amber-600">Neto Oro</th>
                  <th class="p-2.5 text-right font-mono">Oro Fino 24K</th>
                  <th class="p-2.5 text-center">Gaveta</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                ${(() => {
                  const mPag = window.MartelaUI.paginate(availablePieces, mlsPiecesPage, mlsPiecesPageSize);
                  return mPag.items.map(p => {
                    const isChecked = mlsConfig.selectedPieceIds.has(p.piece_id);
                    const prod = db.products_sku.find(x => x.sku === p.sku_ref) || {};
                    const neto = Number(p.peso_neto_g || 1.8);
                    const oroFino = isPlata ? 0 : +(neto * factorOroFino).toFixed(5);

                    return `
                      <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40 ${isChecked ? 'bg-amber-500/5' : ''}">
                        <td class="p-2.5 text-center">
                          <input 
                            type="checkbox" 
                            ${isChecked ? 'checked' : ''} 
                            onchange="MartelaCoppel.toggleMlsPiece('${p.piece_id}')"
                            class="rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                        <td class="p-2.5 font-bold text-amber-600 dark:text-amber-400">${esc(p.piece_id)}</td>
                        <td class="p-2.5">${esc(p.sku_ref)}</td>
                        <td class="p-2.5 font-sans font-semibold">${esc(p.modelo || prod.modelo_martela || 'MRT-AN-1042')}</td>
                        <td class="p-2.5 font-sans">${esc(prod.quilataje || '10K')}</td>
                        <td class="p-2.5 text-right">${Number(p.peso_bruto_g || 2.0).toFixed(4)}g</td>
                        <td class="p-2.5 text-right text-slate-400">${Number(p.peso_piedra_g || 0.18).toFixed(4)}g</td>
                        <td class="p-2.5 text-right font-bold text-slate-900 dark:text-white">${neto.toFixed(4)}g</td>
                        <td class="p-2.5 text-right text-amber-600 font-bold">${oroFino.toFixed(5)}g</td>
                        <td class="p-2.5 text-center text-slate-400">${esc(p.drawer_id || 'BOVEDA-R1-N2-G05')}</td>
                      </tr>
                    `;
                  }).join('');
                })()}
              </tbody>
            </table>
          </div>
          ${(() => {
            const mPag = window.MartelaUI.paginate(availablePieces, mlsPiecesPage, mlsPiecesPageSize);
            return window.MartelaUI.renderPaginationControls({
              totalItems: mPag.totalItems,
              currentPage: mPag.currentPage,
              pageSize: mPag.pageSize,
              totalPages: mPag.totalPages,
              startIdx: mPag.startIdx,
              endIdx: mPag.endIdx,
              onPageChange: 'MartelaCoppel.goToMlsPiecesPage',
              onPageSizeChange: 'MartelaCoppel.setMlsPiecesPageSize',
              itemName: 'piezas físicas en bóveda'
            });
          })()}
        </div>

        <!-- Historial de Remisiones Emitidas para MLS -->
        <div class="panel overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Historial de Remisiones y Salidas B2B Montepío Luz Saviñón
              </h3>
              <p class="text-[11px] text-slate-400">Expedientes sellados con folio inviolable y layout oficial de 16 columnas.</p>
            </div>
            <span class="text-xs text-slate-500 font-mono">${remisionesMls.length} remisiones registradas</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th class="p-3">Folio Remisión</th>
                  <th class="p-3">Centro Logístico</th>
                  <th class="p-3">Metal / Ley</th>
                  <th class="p-3 text-center">Folio Sello Bolsa</th>
                  <th class="p-3 text-center">Peso c/Bolsa</th>
                  <th class="p-3 text-center">Piezas</th>
                  <th class="p-3 text-right">Oro Fino 24K</th>
                  <th class="p-3 text-right">Público c/IVA</th>
                  <th class="p-3 text-center">Estatus</th>
                  <th class="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                ${(() => {
                  const rPag = window.MartelaUI.paginate(remisionesMls, mlsRemisionesPage, mlsRemisionesPageSize);
                  return rPag.items.map(r => `
                    <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td class="p-3 font-bold text-amber-600 dark:text-amber-400">${esc(r.folio_remision)}</td>
                      <td class="p-3 font-sans font-semibold">${esc(r.centro_nombre || r.centro_logistico_id)}</td>
                      <td class="p-3 font-sans">${esc(r.tipo_metal)}</td>
                      <td class="p-3 text-center">
                        <span class="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          ${esc(r.folio_sello_seguridad)}
                        </span>
                      </td>
                      <td class="p-3 text-center">${Number(r.peso_bruto_con_bolsa_g).toFixed(2)} g</td>
                      <td class="p-3 text-center font-bold font-sans">${r.total_piezas}</td>
                      <td class="p-3 text-right text-amber-600 font-bold">${Number(r.total_oro_fino_g || 0).toFixed(5)}g</td>
                      <td class="p-3 text-right font-sans font-bold">${money(r.total_publico_con_iva)}</td>
                      <td class="p-3 text-center font-sans">
                        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${r.estatus === 'EN_RUTA' ? 'bg-blue-500/20 text-blue-600' : 'bg-amber-500/20 text-amber-700'}">
                          ${esc(r.estatus)}
                        </span>
                      </td>
                      <td class="p-3 text-center font-sans">
                        <button onclick="MartelaCoppel.exportLayoutExcel16Cols('COP-2026-W42', '${r.centro_logistico_id}')" class="text-emerald-600 font-bold hover:underline mr-2">
                          📊 .xlsx
                        </button>
                        <button onclick="MartelaCoppel.openRemisionPdfModal('COP-2026-W42', '${r.centro_logistico_id}')" class="text-amber-600 font-bold hover:underline">
                          📄 PDF
                        </button>
                      </td>
                    </tr>
                  `).join('');
                })()}
              </tbody>
            </table>
          </div>
          ${(() => {
            const rPag = window.MartelaUI.paginate(remisionesMls, mlsRemisionesPage, mlsRemisionesPageSize);
            return window.MartelaUI.renderPaginationControls({
              totalItems: rPag.totalItems,
              currentPage: rPag.currentPage,
              pageSize: rPag.pageSize,
              totalPages: rPag.totalPages,
              startIdx: rPag.startIdx,
              endIdx: rPag.endIdx,
              onPageChange: 'MartelaCoppel.goToMlsRemisionesPage',
              onPageSizeChange: 'MartelaCoppel.setMlsRemisionesPageSize',
              itemName: 'remisiones MLS'
            });
          })()}
        </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // SUB-VISTA 3: MAYORISTAS & BOUTIQUES (VENTA LIBRE POR SKU Y REMISIÓN)
  // =========================================================================
  function renderWholesaleTab(db, availablePieces, user) {
    const { esc, money } = window.MartelaUI;
    const clients = (db.clients || []).filter(c => c.id !== 'CLI-001'); // Clientes independientes
    const products = db.products_sku || [];
    const wholesaleOrders = db.wholesale_orders || [];

    const selectedClient = clients.find(c => c.id === wholesaleConfig.selectedClientId) || clients[0] || {};
    const subtotal = wholesaleConfig.cartItems.reduce((acc, i) => acc + i.subtotal, 0);
    const iva16 = +(subtotal * 0.16).toFixed(2);
    const totalFinal = +(subtotal + iva16).toFixed(2);
    const totalPzs = wholesaleConfig.cartItems.reduce((acc, i) => acc + i.cantidad, 0);
    const wsPag = window.MartelaUI.paginate(wholesaleConfig.cartItems, wsCartPage, wsCartPageSize);

    return `
      <div class="space-y-6">
        <!-- Encabezado de Venta Mayorista -->
        <div class="panel p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl shadow-xl">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-500 text-white">CANAL MAYORISTA INDEPENDIENTE</span>
                <span class="text-xs text-slate-400">Joyerías del Centro, Boutiques &amp; Distribuidores</span>
              </div>
              <h2 class="text-xl font-black mt-1">Cotizador y Emisión Directa de Pedidos Mayoristas</h2>
              <p class="text-xs text-slate-300">
                Captura libre de pedidos por código SKU, cotización inmediata con margen mayorista y emisión de Nota de Salida.
              </p>
            </div>
            
            <div class="bg-indigo-500/20 border border-indigo-500/40 px-4 py-2 rounded-2xl text-right">
              <div class="text-[10px] uppercase font-bold text-indigo-300">Total Cotizado del Pedido</div>
              <div class="text-lg font-black font-mono text-white">${money(totalFinal)}</div>
            </div>
          </div>
        </div>

        <!-- Formulario de Captura Rápida de Partidas por SKU -->
        <div class="panel p-5 bg-white dark:bg-slate-900">
          <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
            1. Configurar Partida Mayorista:
          </h3>
          <div class="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Cliente Mayorista:</label>
              <select 
                class="text-xs font-bold" 
                onchange="MartelaCoppel.handleWholesaleClientChange(this.value)"
              >
                ${clients.map(c => `
                  <option value="${c.id}" ${c.id === wholesaleConfig.selectedClientId ? 'selected' : ''}>
                    ${c.nombre} (${c.rfc || 'RFC Genérico'})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Modelo / SKU Catálogo:</label>
              <select 
                id="wholesaleSkuSelect" 
                class="text-xs font-mono font-bold"
                onchange="MartelaCoppel.handleWholesaleSkuChange(this.value)"
              >
                ${products.map(p => `
                  <option value="${p.sku}" ${p.sku === wholesaleConfig.selectedSku ? 'selected' : ''}>
                    ${p.modelo_martela || p.sku} — ${p.descripcion.slice(0, 30)} (${p.quilataje})
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Cantidad de Piezas:</label>
              <input 
                id="wholesaleQtyInput" 
                type="number" 
                min="1" 
                max="50" 
                value="${wholesaleConfig.cantidad}" 
                oninput="wholesaleConfig.cantidad = parseInt(this.value) || 1"
                class="text-xs font-bold" 
              />
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-500 block mb-1">Margen Mayorista (%):</label>
              <select 
                class="text-xs font-bold text-emerald-600"
                onchange="wholesaleConfig.margenPct = parseInt(this.value)"
              >
                <option value="20" ${wholesaleConfig.margenPct === 20 ? 'selected' : ''}>20% (Gran Volumen)</option>
                <option value="25" ${wholesaleConfig.margenPct === 25 ? 'selected' : ''}>25% (Medio Mayoreo)</option>
                <option value="30" ${wholesaleConfig.margenPct === 30 ? 'selected' : ''}>30% (Estándar Mayorista)</option>
                <option value="35" ${wholesaleConfig.margenPct === 35 ? 'selected' : ''}>35% (Boutique Joyera)</option>
                <option value="40" ${wholesaleConfig.margenPct === 40 ? 'selected' : ''}>40% (Distribuidor Preferente)</option>
              </select>
            </div>
          </div>

          <div class="flex justify-end">
            <button onclick="MartelaCoppel.addWholesaleItemToCart()" class="btn btn-gold text-xs py-2 px-4 shadow-sm">
              <span>+</span> Agregar Partida al Pedido Mayorista
            </button>
          </div>
        </div>

        <!-- Tabla de Partidas del Pedido Actual -->
        <div class="panel overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                2. Partidas del Pedido: ${esc(selectedClient.nombre || 'Mayorista')}
              </h3>
              <p class="text-[11px] text-slate-400">Total: ${totalPzs} piezas · Desglose comercial con IVA 16%.</p>
            </div>
            
            <div class="flex items-center gap-2">
              <button 
                onclick="MartelaCoppel.openWholesaleRemisionPdfModal()" 
                class="btn btn-soft text-xs" 
                ${wholesaleConfig.cartItems.length === 0 ? 'disabled' : ''}
              >
                <span>📄</span> Imprimir Remisión PDF
              </button>
              <button 
                onclick="MartelaCoppel.confirmWholesaleOrderDispatch()" 
                class="btn btn-gold text-xs font-bold" 
                ${wholesaleConfig.cartItems.length === 0 ? 'disabled' : ''}
              >
                <span>🔒</span> Confirmar Pedido y Descontar Bóveda
              </button>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase text-[11px]">
                <tr>
                  <th class="p-2.5">SKU 14</th>
                  <th class="p-2.5">Modelo</th>
                  <th class="p-2.5 font-sans">Descripción</th>
                  <th class="p-2.5 text-center">Cant</th>
                  <th class="p-2.5 text-right">Peso Unit</th>
                  <th class="p-2.5 text-right">Costo Base</th>
                  <th class="p-2.5 text-center">Margen</th>
                  <th class="p-2.5 text-right">Precio Mayorista</th>
                  <th class="p-2.5 text-right font-bold text-amber-600">Subtotal</th>
                  <th class="p-2.5 text-center font-sans">Eliminar</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 text-[11px]">
                ${wsPag.items.map((item, idx) => `
                  <tr>
                    <td class="p-2.5 font-bold text-amber-600 dark:text-amber-400">${esc(item.sku)}</td>
                    <td class="p-2.5">${esc(item.modelo)}</td>
                    <td class="p-2.5 font-sans">${esc(item.descripcion)}</td>
                    <td class="p-2.5 text-center font-bold">${item.cantidad}</td>
                    <td class="p-2.5 text-right">${Number(item.peso_unit_g).toFixed(2)}g</td>
                    <td class="p-2.5 text-right font-sans">${money(item.costo_unit)}</td>
                    <td class="p-2.5 text-center text-emerald-600 font-bold font-sans">${item.margen_pct}%</td>
                    <td class="p-2.5 text-right font-sans font-bold">${money(item.precio_unit)}</td>
                    <td class="p-2.5 text-right font-sans font-black text-slate-900 dark:text-white">${money(item.subtotal)}</td>
                    <td class="p-2.5 text-center font-sans">
                      <button onclick="MartelaCoppel.removeWholesaleCartItem(${wsPag.startIndex + idx})" class="text-rose-500 hover:underline">
                        ✕
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          ${window.MartelaUI.renderPaginationControls({
            currentPage: wsPag.currentPage,
            totalPages: wsPag.totalPages,
            pageSize: wsPag.pageSize,
            totalItems: wsPag.totalItems,
            startIndex: wsPag.startIndex,
            endIndex: wsPag.endIndex,
            onPageChange: 'MartelaCoppel.goToWsCartPage',
            onPageSizeChange: 'MartelaCoppel.setWsCartPageSize'
          })}

          <div class="p-4 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <div class="w-72 space-y-1 text-xs text-right">
              <div class="flex justify-between text-slate-500">
                <span>Subtotal Partidas:</span>
                <span class="font-mono font-bold">${money(subtotal)}</span>
              </div>
              <div class="flex justify-between text-slate-500">
                <span>IVA Trasladado (16%):</span>
                <span class="font-mono font-bold">${money(iva16)}</span>
              </div>
              <div class="flex justify-between text-sm font-black text-slate-900 dark:text-white pt-2 border-t border-slate-300 dark:border-slate-700">
                <span>Total a Pagar:</span>
                <span class="font-mono text-amber-600 dark:text-amber-400">${money(totalFinal)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Historial de Pedidos Mayoristas -->
        <div class="panel overflow-hidden">
          <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
            <div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                3. Historial de Pedidos Mayoristas Emitidos
              </h3>
              <p class="text-[11px] text-slate-400">Salidas comerciales independientes registradas.</p>
            </div>
            <span class="text-xs text-slate-500 font-mono">${wholesaleOrders.length} pedidos</span>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-mono text-[11px]">
                <tr>
                  <th class="p-3">Folio Pedido</th>
                  <th class="p-3">Cliente Mayorista</th>
                  <th class="p-3">RFC</th>
                  <th class="p-3 text-center">Piezas</th>
                  <th class="p-3 text-right">Subtotal</th>
                  <th class="p-3 text-right">Total c/IVA</th>
                  <th class="p-3 text-center">Factura SAE</th>
                  <th class="p-3 text-center">Estatus</th>
                  <th class="p-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                ${wholesaleOrders.map(o => `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-3 font-bold text-amber-600 dark:text-amber-400">${esc(o.folio)}</td>
                    <td class="p-3 font-sans font-semibold">${esc(o.cliente_nombre)}</td>
                    <td class="p-3">${esc(o.rfc)}</td>
                    <td class="p-3 text-center font-bold font-sans">${o.total_piezas}</td>
                    <td class="p-3 text-right font-sans">${money(o.subtotal)}</td>
                    <td class="p-3 text-right font-sans font-bold text-slate-900 dark:text-white">${money(o.total)}</td>
                    <td class="p-3 text-center">${esc(o.factura_sae || 'SAE-F-90825')}</td>
                    <td class="p-3 text-center font-sans">
                      <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        ${esc(o.estatus)}
                      </span>
                    </td>
                    <td class="p-3 text-center font-sans">
                      <button onclick="MartelaCoppel.openWholesaleRemisionPdfModal('${o.folio}')" class="text-amber-600 font-bold hover:underline">
                        📄 Ver Remisión
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // CONTROLADORES INTERACTIVOS MAYORISTAS & BOUTIQUES
  // =========================================================================
  function handleWholesaleClientChange(clientId) {
    wholesaleConfig.selectedClientId = clientId;
    render(document.getElementById('contentContainer'));
  }

  function handleWholesaleSkuChange(sku) {
    wholesaleConfig.selectedSku = sku;
  }

  function addWholesaleItemToCart() {
    const db = window.apiFacade._getDB();
    const prod = db.products_sku.find(p => p.sku === wholesaleConfig.selectedSku) || db.products_sku[0];
    const qty = Math.max(1, wholesaleConfig.cantidad || 1);
    const margen = wholesaleConfig.margenPct || 30;

    const rates = db.metal_rates || { fix_oro_hoy_usd: 2680, tipo_cambio_usd_mxn: 18.25 };
    const gramoOroFinoMxn = +(rates.fix_oro_hoy_usd * rates.tipo_cambio_usd_mxn / 31.1035).toFixed(2);
    const factor = Number(prod.factor_oro_fino || 0.41667);
    const costoMetalGramo = prod.metal_tipo === 'PLATA_925' ? 24.80 : +(gramoOroFinoMxn * factor).toFixed(2);
    const pesoNeto = +(Math.max(0.5, (prod.peso_bruto_promedio_g || 2.0) - (prod.peso_piedra_cz || 0.18))).toFixed(2);
    
    const costoMo = Number(prod.costo_mo_base || 185.00);
    const costoMetal = +(pesoNeto * costoMetalGramo).toFixed(2);
    const costoBaseUnit = +(costoMo + costoMetal).toFixed(2);
    const precioMayoristaUnit = +(costoBaseUnit * (1 + margen / 100)).toFixed(2);
    const subtotal = +(precioMayoristaUnit * qty).toFixed(2);

    wholesaleConfig.cartItems.push({
      sku: prod.sku,
      modelo: prod.modelo_martela || prod.sku,
      descripcion: prod.descripcion,
      quilataje: prod.quilataje,
      cantidad: qty,
      peso_unit_g: pesoNeto,
      costo_unit: costoBaseUnit,
      margen_pct: margen,
      precio_unit: precioMayoristaUnit,
      subtotal: subtotal
    });

    window.MartelaUI.toast(`Agregadas ${qty} piezas de ${prod.modelo_martela || prod.sku}`, 'success');
    render(document.getElementById('contentContainer'));
  }

  function removeWholesaleCartItem(index) {
    wholesaleConfig.cartItems.splice(index, 1);
    render(document.getElementById('contentContainer'));
  }

  function goToWsCartPage(page) {
    wsCartPage = page;
    window.MartelaUI.flashLoading('Cargando partidas del pedido...', 250);
    render(document.getElementById('contentContainer'));
  }

  function setWsCartPageSize(size) {
    wsCartPageSize = parseInt(size, 10);
    wsCartPage = 1;
    window.MartelaUI.flashLoading('Actualizando vista...', 250);
    render(document.getElementById('contentContainer'));
  }

  async function confirmWholesaleOrderDispatch() {
    if (wholesaleConfig.cartItems.length === 0) {
      window.MartelaUI.toast('El pedido no tiene partidas registradas', 'warning');
      return;
    }

    const db = window.apiFacade._getDB();
    const client = db.clients.find(c => c.id === wholesaleConfig.selectedClientId) || db.clients[0];
    const subtotal = wholesaleConfig.cartItems.reduce((acc, i) => acc + i.subtotal, 0);
    const iva16 = +(subtotal * 0.16).toFixed(2);
    const total = +(subtotal + iva16).toFixed(2);
    const totalPiezas = wholesaleConfig.cartItems.reduce((acc, i) => acc + i.cantidad, 0);

    window.MartelaUI.confirmModal({
      title: `Confirmar Pedido Mayorista — ${client.nombre}`,
      message: `¿Autorizar salida y remisión comercial por ${totalPiezas} piezas? Total cotizado: $${total.toLocaleString('es-MX')} MXN. Se apartarán las piezas de bóveda.`,
      confirmText: 'Autorizar y Descontar Bóveda',
      confirmClass: 'btn btn-gold font-bold',
      onConfirm: async () => {
        try {
          window.MartelaUI.showLoading('Generando remisión comercial y descontando inventario...');
          const order = await window.apiFacade.createWholesaleOrder({
            cliente_id: client.id,
            cliente_nombre: client.nombre,
            rfc: client.rfc || 'JCE850201BB2',
            partidas: [...wholesaleConfig.cartItems],
            total_piezas: totalPiezas,
            subtotal: subtotal,
            iva_16: iva16,
            total: total
          });
          window.MartelaUI.hideLoading();
          window.MartelaUI.toast(`Pedido ${order.folio} registrado y descontado con éxito`, 'success');
          wholesaleConfig.cartItems = [];
          render(document.getElementById('contentContainer'));
        } catch (err) {
          window.MartelaUI.hideLoading();
          window.MartelaUI.toast(err.message, 'error');
        }
      }
    });
  }

  function openWholesaleRemisionPdfModal(orderFolio = '') {
    const db = window.apiFacade._getDB();
    const orders = db.wholesale_orders || [];
    const order = orders.find(o => o.folio === orderFolio) || {
      folio: `COT-MAY-2026-${Date.now().toString().slice(-4)}`,
      cliente_nombre: "Joyas del Centro Mayoristas",
      rfc: "JCE850201BB2",
      partidas: wholesaleConfig.cartItems,
      subtotal: wholesaleConfig.cartItems.reduce((acc, i) => acc + i.subtotal, 0),
      iva_16: +(wholesaleConfig.cartItems.reduce((acc, i) => acc + i.subtotal, 0) * 0.16).toFixed(2),
      total: +(wholesaleConfig.cartItems.reduce((acc, i) => acc + i.subtotal, 0) * 1.16).toFixed(2),
      factura_sae: "SAE-F-90825"
    };

    const { money, esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4 text-xs font-sans">
        <div class="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-4 gap-3">
            <div>
              <div class="text-xl font-black tracking-widest">MARTELA JOYERÍA FINA S.A. DE C.V.</div>
              <div class="text-xs text-slate-500 font-mono">NOTA DE REMISIÓN / ENTREGA DE MERCANCÍA MAYORISTA</div>
            </div>
            <div class="text-right font-mono">
              <div class="px-3 py-1 rounded bg-slate-900 text-amber-400 font-black text-sm">
                FOLIO: ${esc(order.folio)}
              </div>
              <div class="text-[11px] text-slate-600 mt-1">FACTURA SAE: <b>${esc(order.factura_sae || 'SAE-F-90825')}</b></div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-100 p-3 rounded-xl font-mono text-[11px]">
            <div>Cliente Mayorista:<br><b>${esc(order.cliente_nombre)}</b></div>
            <div>RFC Fiscal:<br><b>${esc(order.rfc || 'XAXX010101000')}</b></div>
            <div>Fecha de Emisión:<br><b>${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</b></div>
          </div>

          <div class="overflow-x-auto max-h-60">
            <table class="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr class="border-b border-slate-300 bg-slate-50 uppercase">
                  <th class="p-1.5">SKU 14</th>
                  <th class="p-1.5">Descripción</th>
                  <th class="p-1.5 text-center">Cant</th>
                  <th class="p-1.5 text-right">Precio Mayoreo</th>
                  <th class="p-1.5 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${(order.partidas || []).map(p => `
                  <tr>
                    <td class="p-1.5 font-bold">${esc(p.sku)}</td>
                    <td class="p-1.5">${esc(p.descripcion)}</td>
                    <td class="p-1.5 text-center font-bold">${p.cantidad}</td>
                    <td class="p-1.5 text-right">${money(p.precio_unit)}</td>
                    <td class="p-1.5 text-right font-black">${money(p.subtotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="flex justify-end pt-2 border-t border-slate-300">
            <div class="w-64 space-y-1 font-mono text-[11px] text-right">
              <div class="flex justify-between"><span>Subtotal:</span><span>${money(order.subtotal)}</span></div>
              <div class="flex justify-between"><span>IVA 16%:</span><span>${money(order.iva_16)}</span></div>
              <div class="flex justify-between text-sm font-bold border-t pt-1"><span>Total Facturado:</span><span class="text-amber-600">${money(order.total)}</span></div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4 pt-4 border-t border-slate-300 text-center text-[11px]">
            <div class="pt-6 border-t border-slate-400">Entregado por Bóveda Martela<br><b>Elisa Ramírez / David Morales</b></div>
            <div class="pt-6 border-t border-slate-400">Recibido Conforme por Cliente Mayorista<br><b>Firma y Sello de Recepción</b></div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">Cerrar</button>
          <button onclick="window.print()" class="btn btn-gold">🖨️ Imprimir Remisión (.pdf)</button>
        </div>
      </div>
    `;
    window.MartelaUI.openModal(`Remisión Mayorista — ${order.folio}`, html, 'max-w-3xl');
  }

  // =========================================================================
  // CONTROLADORES INTERACTIVOS MONTEPÍO LUZ SAVIÑÓN (MLS)
  // =========================================================================
  function handleMlsCentroChange(centroId) {
    mlsConfig.selectedCentro = centroId;
    const centro = MLS_CENTROS.find(c => c.id === centroId);
    if (centro) {
      mlsConfig.folioSello = centro.selloDefecto;
      mlsConfig.facturaSae = centro.saeDefecto;
      mlsConfig.pesoBolsa = centro.pesoDefecto;
    }
    render(document.getElementById('contentContainer'));
  }

  function handleMlsMetalChange(metal) {
    mlsConfig.tipoMetal = metal;
    render(document.getElementById('contentContainer'));
  }

  function handleMlsFieldChange(field, value) {
    mlsConfig[field] = value;
  }

  function toggleMlsPiece(pieceId) {
    if (mlsConfig.selectedPieceIds.has(pieceId)) {
      mlsConfig.selectedPieceIds.delete(pieceId);
    } else {
      mlsConfig.selectedPieceIds.add(pieceId);
    }
    render(document.getElementById('contentContainer'));
  }

  function toggleSelectAllMlsPieces(selectAll) {
    const db = window.apiFacade._getDB();
    const available = (db.inventory_pieces || []).filter(p => p.estatus === 'DISPONIBLE').slice(0, 30);
    if (selectAll) {
      available.forEach(p => mlsConfig.selectedPieceIds.add(p.piece_id));
    } else {
      mlsConfig.selectedPieceIds.clear();
    }
    render(document.getElementById('contentContainer'));
  }

  function preselectSuggestedMlsBatch() {
    const db = window.apiFacade._getDB();
    const available = (db.inventory_pieces || []).filter(p => p.estatus === 'DISPONIBLE');
    mlsConfig.selectedPieceIds.clear();
    available.slice(0, 17).forEach(p => mlsConfig.selectedPieceIds.add(p.piece_id));
    window.MartelaUI.toast(`Lote sugerido de 17 piezas precargado para ${mlsConfig.tipoMetal}`, 'info');
    render(document.getElementById('contentContainer'));
  }

  async function exportMlsLayout16Cols() {
    const centro = MLS_CENTROS.find(c => c.id === mlsConfig.selectedCentro) || MLS_CENTROS[0];
    await exportLayoutExcel16Cols('COP-2026-W42', centro.id);
  }

  function openMlsRemisionPdfModal() {
    const centro = MLS_CENTROS.find(c => c.id === mlsConfig.selectedCentro) || MLS_CENTROS[0];
    openRemisionPdfModal('COP-2026-W42', centro.id);
  }

  async function confirmAndExecuteMlsDispatch() {
    const centro = MLS_CENTROS.find(c => c.id === mlsConfig.selectedCentro) || MLS_CENTROS[0];
    const pieceIds = Array.from(mlsConfig.selectedPieceIds);
    if (pieceIds.length === 0) {
      window.MartelaUI.toast('Debes seleccionar al menos una pieza para armar la remisión', 'warning');
      return;
    }

    const db = window.apiFacade._getDB();
    const selectedPieces = db.inventory_pieces.filter(p => pieceIds.includes(p.piece_id));
    const totalNeto = selectedPieces.reduce((acc, p) => acc + Number(p.peso_neto_g || 1.8), 0);
    const isPlata = mlsConfig.tipoMetal === 'PLATA_925';
    const factor = isPlata ? 0 : (mlsConfig.tipoMetal === 'ORO_14K' ? 0.58333 : 0.41667);
    const totalOroFinoG = +(totalNeto * factor).toFixed(5);

    window.MartelaUI.confirmModal({
      title: `Autorizar Remisión MLS — ${centro.nombre}`,
      message: `¿Confirmar salida de ${pieceIds.length} piezas físicas con Sello ${mlsConfig.folioSello}? ${!isPlata ? `Se debitarán ${totalOroFinoG}g Au 24K de la cuenta de maquila de Montepío.` : ''}`,
      confirmText: 'Autorizar y Debitar Maquila',
      confirmClass: 'btn btn-gold font-bold',
      onConfirm: async () => {
        try {
          window.MartelaUI.showLoading('Generando remisión y debitando cuenta corriente...');
          const remision = await window.apiFacade.createMlsRemision({
            centro_logistico_id: centro.id,
            centro_nombre: centro.nombre,
            tipo_metal: mlsConfig.tipoMetal,
            factura_sae: mlsConfig.facturaSae,
            folio_sello_seguridad: mlsConfig.folioSello,
            peso_bruto_con_bolsa_g: mlsConfig.pesoBolsa,
            piezas_ids: pieceIds,
            total_peso_neto_oro_g: totalNeto,
            total_oro_fino_g: totalOroFinoG
          });
          window.MartelaUI.hideLoading();
          window.MartelaUI.toast(`Remisión ${remision.folio_remision} creada exitosamente`, 'success');
          mlsConfig.selectedPieceIds.clear();
          render(document.getElementById('contentContainer'));
        } catch (err) {
          window.MartelaUI.hideLoading();
          window.MartelaUI.toast(err.message, 'error');
        }
      }
    });
  }

  // =========================================================================
  // CONTROLADORES COPPEL (DRAG & DROP, ASIGNACIÓN Y DESPACHO)
  // =========================================================================
  function toggleBranchAccordion(tiendaId) {
    if (expandedBranches.has(tiendaId)) {
      expandedBranches.delete(tiendaId);
    } else {
      expandedBranches.add(tiendaId);
    }
    render(document.getElementById('contentContainer'));
  }

  async function handleFileSelect(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    await processUploadedExcelFile(file);
  }

  async function handleDemoFileLoad() {
    const mockFile = {
      name: "Coppel_Consolidado_Semanal_W46.xlsx",
      size: 48920
    };
    await processUploadedExcelFile(mockFile, true);
  }

  async function processUploadedExcelFile(file, isMock = false) {
    const barWrap = document.getElementById('uploadProgressBarContainer');
    const bar = document.getElementById('uploadProgressBar');
    const pct = document.getElementById('uploadProgressPct');
    const lbl = document.getElementById('uploadProgressLabel');

    if (barWrap) barWrap.classList.remove('hidden');

    const updateProgress = (val, text) => {
      if (bar) bar.style.width = `${val}%`;
      if (pct) pct.textContent = `${val}%`;
      if (lbl) lbl.textContent = text;
    };

    updateProgress(20, 'Leyendo archivo binario de Coppel...');
    await new Promise(r => setTimeout(r, 200));

    updateProgress(50, 'Analizando columnas de Tiendas, SKUs y Cantidades...');
    await new Promise(r => setTimeout(r, 250));

    updateProgress(85, 'Generando orden de pedido con folio consecutivo...');
    await new Promise(r => setTimeout(r, 200));

    updateProgress(100, '¡Archivo validado correctamente!');
    await new Promise(r => setTimeout(r, 150));

    const now = new Date();
    const year = now.getFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const generatedFolio = `COP-${year}-W${weekNumber}-${randomSuffix}`;

    openConfirmUploadModal({
      folio: generatedFolio,
      fileName: file.name,
      totalPiezas: 438,
      totalTiendas: 26,
      fecha: new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    });

    if (barWrap) barWrap.classList.add('hidden');
  }

  function openConfirmUploadModal(data) {
    const { esc } = window.MartelaUI;
    const html = `
      <div class="space-y-4 text-xs">
        <div class="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-slate-800 dark:text-slate-200">
          <div class="flex items-center gap-2 font-bold text-amber-600 dark:text-amber-400 text-sm mb-1">
            <span>✅</span> Pedido Semanal Leído con Éxito
          </div>
          <div>El archivo de Coppel fue procesado mediante SheetJS y está listo para ser registrado en la Mesa de Despiece.</div>
        </div>

        <div class="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
          <div>Folio Único Consecutivo:<br><b class="text-sm font-black text-amber-600 dark:text-amber-400">${esc(data.folio)}</b></div>
          <div>Estatus Inicial:<br><b class="text-blue-600">CARGADO (Listo p/Surtido)</b></div>
          <div>Archivo Origen:<br><b>${esc(data.fileName)}</b></div>
          <div>Fecha de Descarga Portal:<br><b>${esc(data.fecha)}</b></div>
          <div>Total de Tiendas / CEDIS:<br><b>${data.totalTiendas} centros logísticos</b></div>
          <div>Total Piezas Solicitadas:<br><b class="text-sm font-bold text-slate-900 dark:text-white">${data.totalPiezas} piezas</b></div>
        </div>

        <div class="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-500">
          Al confirmar, la orden se registrará en el sistema y podrás ejecutar la <b>asignación automática inteligente (FIFO)</b> para vincular las piezas físicas reales con código de barras y gramos netos en bóveda.
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="button" onclick="MartelaCoppel.confirmOrderRegistration('${data.folio}', '${data.fileName}', ${data.totalPiezas})" class="btn btn-gold">
            Confirmar y Abrir Mesa de Despiece →
          </button>
        </div>
      </div>
    `;
    window.MartelaUI.openModal('Registro de Orden Semanal Coppel B2B', html, 'max-w-lg');
  }

  async function confirmOrderRegistration(folio, fileName, totalPiezas) {
    try {
      window.MartelaUI.showLoading('Registrando orden en base de datos...');
      await window.apiFacade.createCoppelOrderFromLayout({
        order_id: folio,
        fileName: fileName,
        total_piezas: totalPiezas
      });
      window.MartelaUI.hideLoading();
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Orden ${folio} registrada. Lista para surtido automático.`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.hideLoading();
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function assignPieces(orderId) {
    try {
      window.MartelaUI.showLoading('Despiezando y asignando 438 sub-piezas físicas por CEDIS...');
      await new Promise(r => setTimeout(r, 250));
      await window.apiFacade.assignPiecesToCoppelOrder(orderId);
      window.MartelaUI.hideLoading();
      window.MartelaUI.toast('438 sub-piezas físicas asignadas automáticamente a los Centros Logísticos (100% Conciliado)', 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.hideLoading();
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function confirmAndDeduct(orderId) {
    window.MartelaUI.confirmModal({
      title: 'Confirmar Despacho y Descontar Inventario',
      message: '¿Autorizar la salida de las 438 piezas físicas asignadas a Coppel? El sistema descontará el stock de la Bóveda General, cambiará el estatus de las piezas a EN_RUTA y sellará la orden para traslado logístico.',
      confirmText: 'Autorizar y Descontar Stock',
      confirmClass: 'btn bg-rose-600 hover:bg-rose-700 text-white font-bold',
      onConfirm: async () => {
        try {
          window.MartelaUI.showLoading('Descontando inventario en bóveda y sellando orden...');
          const res = await window.apiFacade.confirmAndDeductCoppelInventory(orderId);
          window.MartelaUI.hideLoading();
          window.MartelaUI.toast(`¡Despacho autorizado! ${res.descontadas} piezas descontadas de Bóveda General.`, 'success');
          render(document.getElementById('contentContainer'));
        } catch (err) {
          window.MartelaUI.hideLoading();
          window.MartelaUI.toast(err.message, 'error');
        }
      }
    });
  }

  async function exportLayoutExcel16Cols(orderId, tiendaId = '') {
    try {
      const rows = await window.apiFacade.generateOfficial16ColExcelRows(orderId, tiendaId);
      const suffix = tiendaId ? `-${tiendaId}` : '-completo';
      window.MartelaUI.exportToExcel(rows, `layout-oficial-martela-16cols${suffix}.xlsx`, 'Despiece_Martela');
      window.MartelaUI.toast('Layout oficial de 16 columnas exportado a Excel (.xlsx)', 'success');
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function openEditSealModal(orderId, tiendaId) {
    const db = window.apiFacade._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId) || db.coppel_orders[0];
    const suc = order.sucursales.find(s => s.tienda_id === tiendaId);
    if (!suc) return;
    const { esc } = window.MartelaUI;

    const html = `
      <form onsubmit="MartelaCoppel.saveSealModal(event, '${orderId}', '${tiendaId}')" class="space-y-4">
        <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300">
          Centro Logístico: <b>${esc(suc.numero_sucursal || suc.tienda_id)} — ${esc(suc.nombre)}</b>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Folio Sello Seguridad Plástico</label>
            <input name="sello" value="${esc(suc.sello_seguridad_bolsa || 'Z008340')}" required class="font-mono font-bold" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Factura SAE Vinculada</label>
            <input name="factura_sae" value="${esc(suc.factura_sae || 'SAE-F-90812')}" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Peso Total Verificado c/Bolsa (g)</label>
            <input name="peso_bolsa" type="number" step="0.01" value="${suc.peso_bolsa_verificado_g || 48.60}" required class="font-mono" />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Guardar Sello y Peso</button>
        </div>
      </form>
    `;
    window.MartelaUI.openModal('Verificación de Sello de Seguridad Plástico y Báscula', html, 'max-w-lg');
  }

  async function saveSealModal(e, orderId, tiendaId) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    window.MartelaUI.setButtonLoading(btn, true, 'Validando Sello...');
    try {
      await new Promise(r => setTimeout(r, 200));
      await window.apiFacade.updateBranchRemisionSeal(orderId, tiendaId, {
        sello_seguridad_bolsa: f.sello.value,
        factura_sae: f.factura_sae.value,
        peso_bolsa_verificado_g: parseFloat(f.peso_bolsa.value)
      });
      window.MartelaUI.closeModal();
      window.MartelaUI.toast('Folio de Sello de Seguridad actualizado en la remisión', 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.setButtonLoading(btn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function openRemisionPdfModal(orderId, tiendaId) {
    const db = window.apiFacade._getDB();
    const order = db.coppel_orders.find(o => o.order_id === orderId) || db.coppel_orders[0];
    const suc = order.sucursales.find(s => s.tienda_id === tiendaId) || order.sucursales[0];
    const rows = await window.apiFacade.generateOfficial16ColExcelRows(orderId, suc.tienda_id);
    const { money, esc } = window.MartelaUI;

    const totalBruto = rows.reduce((s, r) => s + Number(r['Peso Bruto']), 0);
    const totalNeto = rows.reduce((s, r) => s + Number(r['Peso Neto Oro']), 0);
    const totalOroFino = rows.reduce((s, r) => s + Number(r['Oro Fino Puro']), 0);
    const totalMartela = rows.reduce((s, r) => s + Number(r['Total Martela']), 0);
    const totalPublico = rows.reduce((s, r) => s + Number(r['Costo Público con IVA']), 0);
    const pesoConBolsa = suc.peso_bolsa_verificado_g || +(totalBruto + 12.50).toFixed(2);

    const html = `
      <div class="space-y-4 text-xs font-sans">
        <div class="p-6 rounded-2xl bg-white text-slate-900 border border-slate-300 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-4 gap-3">
            <div>
              <div class="text-xl font-black tracking-widest">MARTELA JOYERÍA FINA S.A. DE C.V.</div>
              <div class="text-xs text-slate-500 font-mono">HOJA OFICIAL DE SALIDA / REMISIÓN DE VALORES B2B</div>
            </div>
            <div class="text-right font-mono">
              <div class="px-3 py-1 rounded bg-slate-900 text-amber-400 font-black text-sm">
                🔒 FOLIO SELLO BOLSA: ${esc(suc.sello_seguridad_bolsa || 'Z008340')}
              </div>
              <div class="text-[11px] text-slate-600 mt-1">FACTURA SAE: <b>${esc(suc.factura_sae || 'SAE-F-90812')}</b></div>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-100 p-3 rounded-xl font-mono text-[11px]">
            <div>Centro Logístico:<br><b>${esc(suc.numero_sucursal || suc.tienda_id)} - ${esc(suc.nombre)}</b></div>
            <div>Total Piezas:<br><b>${rows.length} sub-piezas</b></div>
            <div>Peso Neto Metal / Oro Fino:<br><b>${totalNeto.toFixed(4)}g / ${totalOroFino.toFixed(5)}g Au</b></div>
            <div>Peso Verificado c/Bolsa:<br><b class="text-emerald-700">${pesoConBolsa.toFixed(2)} g (Báscula OK)</b></div>
          </div>

          <div class="overflow-x-auto max-h-64">
            <table class="w-full text-left text-[11px] font-mono border-collapse">
              <thead>
                <tr class="border-b border-slate-300 bg-slate-50 uppercase">
                  <th class="p-1.5">#</th>
                  <th class="p-1.5">Modelo</th>
                  <th class="p-1.5">SKU 14 Díg</th>
                  <th class="p-1.5">Ley</th>
                  <th class="p-1.5 text-right">Bruto</th>
                  <th class="p-1.5 text-right">Neto</th>
                  <th class="p-1.5 text-right">M.O.</th>
                  <th class="p-1.5 text-right">Metal</th>
                  <th class="p-1.5 text-right font-bold">Total Martela</th>
                  <th class="p-1.5 text-right">Público c/IVA</th>
                  <th class="p-1.5 text-right">Au Fino</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${rows.slice(0, 12).map(r => `
                  <tr>
                    <td class="p-1.5">${r['#']}</td>
                    <td class="p-1.5 font-bold">${esc(r['Modelo Martela'])}</td>
                    <td class="p-1.5">${esc(r['Código de Barras SKU'])}</td>
                    <td class="p-1.5">${esc(r['Kilataje'])}</td>
                    <td class="p-1.5 text-right">${Number(r['Peso Bruto']).toFixed(4)}g</td>
                    <td class="p-1.5 text-right font-bold">${Number(r['Peso Neto Oro']).toFixed(4)}g</td>
                    <td class="p-1.5 text-right">${money(r['Costo M.O.'])}</td>
                    <td class="p-1.5 text-right">${money(r['Costo Metal'])}</td>
                    <td class="p-1.5 text-right font-bold">${money(r['Total Martela'])}</td>
                    <td class="p-1.5 text-right">${money(r['Costo Público con IVA'])}</td>
                    <td class="p-1.5 text-right">${Number(r['Oro Fino Puro']).toFixed(5)}g</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-300 text-center text-[11px]">
            <div class="pt-6 border-t border-slate-400">Firma Bóveda / Mesa Despiece<br><b>David Morales / Elisa Ramírez</b></div>
            <div class="pt-6 border-t border-slate-400">Firma Custodia / Chofer Ruta<br><b>Miguel Torres</b></div>
            <div class="pt-6 border-t border-slate-400">Sello y Firma Recepción Tienda<br><b>Validar Folio: ${esc(suc.sello_seguridad_bolsa || 'Z008340')}</b></div>
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">Cerrar</button>
          <button onclick="window.print()" class="btn btn-gold">🖨️ Imprimir Hoja de Remisión Oficial (.pdf)</button>
        </div>
      </div>
    `;
    window.MartelaUI.openModal(`Hoja de Salida / Remisión Oficial · ${suc.nombre}`, html, 'max-w-4xl');
  }

  async function goToCoppelPage(page) {
    coppelPage = page;
    await window.MartelaUI.flashLoading('Cargando CEDIS de Coppel...', 180);
    render(document.getElementById('contentContainer'));
  }

  async function setCoppelPageSize(size) {
    coppelPageSize = size;
    coppelPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' CEDIS por página...', 220);
    render(document.getElementById('contentContainer'));
  }

  async function goToMlsPiecesPage(page) {
    mlsPiecesPage = page;
    await window.MartelaUI.flashLoading('Cargando piezas de Bóveda para MLS...', 180);
    render(document.getElementById('contentContainer'));
  }

  async function setMlsPiecesPageSize(size) {
    mlsPiecesPageSize = size;
    mlsPiecesPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' piezas por página...', 220);
    render(document.getElementById('contentContainer'));
  }

  async function goToMlsRemisionesPage(page) {
    mlsRemisionesPage = page;
    await window.MartelaUI.flashLoading('Cargando remisiones de Montepío...', 180);
    render(document.getElementById('contentContainer'));
  }

  async function setMlsRemisionesPageSize(size) {
    mlsRemisionesPageSize = size;
    mlsRemisionesPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' remisiones por página...', 220);
    render(document.getElementById('contentContainer'));
  }

  return {
    render,
    switchClientTab,
    toggleBranchAccordion,
    goToCoppelPage,
    setCoppelPageSize,
    goToMlsPiecesPage,
    setMlsPiecesPageSize,
    goToMlsRemisionesPage,
    setMlsRemisionesPageSize,
    handleFileSelect,
    handleDemoFileLoad,
    confirmOrderRegistration,
    assignPieces,
    confirmAndDeduct,
    exportLayoutExcel16Cols,
    openEditSealModal,
    saveSealModal,
    openRemisionPdfModal,
    // Métodos Montepío MLS
    handleMlsCentroChange,
    handleMlsMetalChange,
    handleMlsFieldChange,
    toggleMlsPiece,
    toggleSelectAllMlsPieces,
    preselectSuggestedMlsBatch,
    exportMlsLayout16Cols,
    openMlsRemisionPdfModal,
    confirmAndExecuteMlsDispatch,
    // Métodos Mayoristas
    handleWholesaleClientChange,
    handleWholesaleSkuChange,
    addWholesaleItemToCart,
    removeWholesaleCartItem,
    goToWsCartPage,
    setWsCartPageSize,
    confirmWholesaleOrderDispatch,
    openWholesaleRemisionPdfModal
  };
})();
