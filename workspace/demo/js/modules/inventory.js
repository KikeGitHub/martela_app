/**
 * MARTELA — MÓDULO 3 SDOP: Báscula Digital, Pesaje Individual (Sub-piezas) y Almacén por Gavetas
 * 
 * Arquitectura Optimizada:
 * - Vista principal enfocada en la Tabla Máster de Existencias y desglose de sub-piezas en Bóveda.
 * - Modal ergonómico para la "Mesa de Pesaje Rápido Continuo" (Terminal Báscula Analítica 0.0000 g).
 * - Descuento automático de piedra CZ del catálogo y cálculo de Gramos Oro Fino Puro (5 decimales).
 * - Asignación jerárquica de Gaveta (Almacén -> Rack -> Nivel -> Gaveta, ej. BOVEDA-R1-N2-G05).
 * - Generación e impresión de Etiquetas Térmicas Zebra con atajo Enter ↵.
 */
window.MartelaInventory = (function() {
  let currentFilters = {
    query: '',
    almacen: '',
    quilataje: '',
    estatus: ''
  };
  let sessionWeighedPieces = [];
  let currentPage = 1;
  let pageSize = 20;

  async function render(container) {
    const masterList = await window.apiFacade.getInventoryMasterTable(currentFilters);
    const gavetas = await window.apiFacade.getGavetas();
    const db = window.apiFacade._getDB();
    const { esc, badge } = window.MartelaUI;

    const totalPiezas = db.inventory_pieces.length;
    const totalGramosNeto = db.inventory_pieces.reduce((s, p) => s + Number(p.peso_neto_metal_g ?? p.peso_neto_g ?? 0), 0);
    const totalOroFino = db.inventory_pieces.reduce((s, p) => s + Number(p.gramos_oro_fino || 0), 0);

    container.innerHTML = `
      <!-- Encabezado Módulo 3 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-5">
        <div>
          <div class="text-[11px] uppercase tracking-widest text-slate-500 font-bold mb-1">MÓDULO DE BÓVEDA</div>
          <h1 class="text-2xl font-black text-slate-900 dark:text-white">Báscula Digital y Gavetas</h1>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button id="btnOpenFastScaleModal" onclick="MartelaInventory.openWeighModal()" class="btn btn-gold flex items-center gap-2 py-2 px-3.5 font-bold shadow-sm">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            <span>Pesar Sub-pieza / Báscula Digital</span>
          </button>
          <button onclick="MartelaInventory.exportExcel()" class="btn btn-soft flex items-center gap-1.5 py-2 px-3 text-xs font-semibold">
            <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>
            <span>Exportar Existencias (.xlsx)</span>
          </button>
        </div>
      </div>

      <!-- Métricas Globales de Bóveda -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div class="panel p-3.5 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg">💎</div>
          <div>
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Total Sub-piezas Físicas</div>
            <div class="text-xl font-black text-slate-900 dark:text-white">${totalPiezas} piezas</div>
            <div class="text-[11px] text-emerald-600 font-medium">Serial único y gaveta asignada</div>
          </div>
        </div>
        <div class="panel p-3.5 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg">⚖️</div>
          <div>
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Peso Neto Metal (Sin CZ)</div>
            <div class="text-xl font-black font-mono text-slate-900 dark:text-white">${totalGramosNeto.toFixed(4)} g</div>
            <div class="text-[11px] text-slate-500">Descontando circonias</div>
          </div>
        </div>
        <div class="panel p-3.5 flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-lg">🏛️</div>
          <div>
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Respaldo en Oro Fino (24K)</div>
            <div class="text-xl font-black font-mono text-slate-900 dark:text-white">${totalOroFino.toFixed(5)} g</div>
            <div class="text-[11px] text-slate-500">${gavetas.length} gavetas estructuradas</div>
          </div>
        </div>
      </div>

      <!-- Banner Informativo de Sesión de Pesaje Reciente (si hay piezas en esta sesión) -->
      ${sessionWeighedPieces.length > 0 ? `
        <div class="panel p-4 mb-6 border-l-4 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base">✓</div>
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
                Sesión de Báscula Activa: ${sessionWeighedPieces.length} sub-piezas pesadas y registradas
              </div>
              <div class="text-[11px] text-slate-500">
                Última grabada: <span class="font-mono font-bold text-amber-600 dark:text-amber-400">${sessionWeighedPieces[0].piece_id}</span> (${Number(sessionWeighedPieces[0].peso_neto_metal_g).toFixed(4)}g netos en ${sessionWeighedPieces[0].ubicacion_gaveta})
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="MartelaInventory.openThermalLabelModal('${sessionWeighedPieces[0].piece_id}')" class="btn btn-soft text-xs py-1.5 px-3">
              🖨️ Reimprimir Etiqueta
            </button>
            <button onclick="MartelaInventory.openWeighModal()" class="btn btn-gold text-xs py-1.5 px-3 flex items-center gap-1.5">
              <span>➕</span> Pesar Otra Pieza
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Tabla Máster de Existencias por SKU y Desglose de Sub-piezas -->
      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div class="text-sm font-bold text-slate-900 dark:text-white">
              Existencias por SKU Maestro y Desglose Individual en Gavetas
            </div>
            <div class="text-xs text-slate-400">
              Inventario físico en Bóveda clasificado con número de serie único y peso neto verificado.
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="relative">
              <input
                type="text"
                placeholder="Filtrar SKU o modelo..."
                value="${esc(currentFilters.query)}"
                oninput="MartelaInventory.onSearch(this.value)"
                class="w-48 sm:w-64 text-xs pr-8"
              />
              <span class="absolute right-2.5 top-2.5 text-slate-400 text-xs pointer-events-none">🔍</span>
            </div>
            <button onclick="MartelaInventory.openWeighModal()" class="btn btn-gold text-xs py-2 px-3 whitespace-nowrap flex items-center gap-1.5">
              <span>➕</span> Pesar Joya
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-mono text-[11px] font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-3 py-2.5">SKU / Modelo</th>
                <th class="px-3 py-2.5">Quilataje &amp; CZ</th>
                <th class="px-3 py-2.5 text-center">Existencias Físicas</th>
                <th class="px-3 py-2.5 text-right">Peso Neto Metal</th>
                <th class="px-3 py-2.5 text-center">Estatus</th>
                <th class="px-3 py-2.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${(() => {
                const invPag = window.MartelaUI.paginate(masterList, currentPage, pageSize);
                return invPag.items.map(item => `
                <tr class="hover:bg-slate-100/80 dark:hover:bg-slate-800/50 transition h-10 border-b border-slate-200 dark:border-slate-800 text-xs">
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="flex items-center gap-1.5">
                      <span class="font-mono font-bold text-slate-800 dark:text-slate-100">${esc(item.sku_14 || item.sku)}</span>
                      <span class="text-[11px] font-semibold text-slate-500">(${esc(item.modelo_martela || item.sku)})</span>
                      <span class="text-[11px] text-slate-400 truncate max-w-[200px]" title="${esc(item.descripcion)}">· ${esc(item.descripcion)}</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span class="font-semibold text-slate-800 dark:text-slate-200">${esc(item.quilataje)}</span>
                    <span class="ml-1.5 text-cyan-700 dark:text-cyan-400 font-mono text-[11px] font-medium">-${Number(item.peso_piedra_cz || 0).toFixed(4)}g CZ</span>
                  </td>
                  <td class="px-3 py-2 text-center font-mono whitespace-nowrap">
                    <span class="font-bold text-slate-800 dark:text-slate-200">${item.piezas_total}</span>
                    <span class="text-slate-400 text-[11px]">(${item.piezas_disponibles} disp.)</span>
                  </td>
                  <td class="px-3 py-2 text-right font-mono font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    ${Number(item.peso_neto_total_g).toFixed(4)} g
                  </td>
                  <td class="px-3 py-2 text-center whitespace-nowrap">
                    ${item.alerta_stock ? badge('STOCK BAJO') : badge('DISPONIBLE')}
                  </td>
                  <td class="px-3 py-2 text-center whitespace-nowrap">
                    <div class="inline-flex items-center gap-1.5">
                      <button
                        onclick="MartelaInventory.toggleSubTable('${item.sku}')"
                        class="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900"
                        title="Ver detalle de cada pieza"
                      >
                        Sub-piezas (${item.sub_piezas.length}) ▼
                      </button>
                      <button
                        onclick="MartelaInventory.openWeighModal('${item.sku}')"
                        class="btn btn-soft text-xs py-0.5 px-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 font-semibold"
                        title="Pesar una nueva pieza para este SKU"
                      >
                        ⚖️ Pesar
                      </button>
                    </div>
                  </td>
                </tr>
                <tr id="subrow-${item.sku}" class="hidden bg-slate-50/70 dark:bg-slate-900/60">
                  <td colspan="6" class="p-4">
                    <div class="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                      <div class="px-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs">
                        <span class="font-bold text-slate-700 dark:text-slate-200">
                          Sub-piezas individuales de ${esc(item.modelo_martela)} en Bóveda (${item.sub_piezas.length} piezas):
                        </span>
                        <span class="text-[11px] text-slate-500 font-mono">
                          Descuento paramétrico CZ aplicado: -${Number(item.peso_piedra_cz || 0).toFixed(4)}g
                        </span>
                      </div>
                      <table class="w-full text-xs font-mono">
                        <thead class="bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 uppercase text-[10px]">
                          <tr>
                            <th class="p-2.5">Serial Sub-pieza</th>
                            <th class="p-2.5">Gaveta Física</th>
                            <th class="p-2.5 text-right">Peso Bruto</th>
                            <th class="p-2.5 text-right">(-) Piedra CZ</th>
                            <th class="p-2.5 text-right">(=) Peso Neto Metal</th>
                            <th class="p-2.5 text-right">Oro Fino Puro (24K)</th>
                            <th class="p-2.5 text-center">Estatus</th>
                            <th class="p-2.5 text-center">Etiqueta Zebra</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                          ${item.sub_piezas.map(sp => `
                            <tr class="hover:bg-amber-50/20 dark:hover:bg-amber-950/10">
                              <td class="p-2.5 font-bold text-amber-600 dark:text-amber-400">${esc(sp.piece_id)}</td>
                              <td class="p-2.5">${esc(sp.ubicacion_gaveta || 'BOVEDA-R1-N1-G01')}</td>
                              <td class="p-2.5 text-right">${Number(sp.peso_bruto_g).toFixed(4)} g</td>
                              <td class="p-2.5 text-right text-cyan-600 dark:text-cyan-400">-${Number(sp.peso_piedra_g ?? item.peso_piedra_cz ?? 0).toFixed(4)} g</td>
                              <td class="p-2.5 text-right font-bold text-slate-900 dark:text-white">${Number(sp.peso_neto_metal_g ?? sp.peso_neto_g).toFixed(4)} g</td>
                              <td class="p-2.5 text-right text-amber-600 dark:text-amber-400 font-bold">${Number(sp.gramos_oro_fino || 0).toFixed(5)} g</td>
                              <td class="p-2.5 text-center">${badge(sp.estatus)}</td>
                              <td class="p-2.5 text-center">
                                <button onclick="MartelaInventory.openThermalLabelModal('${esc(sp.piece_id)}')" class="text-amber-600 dark:text-amber-400 hover:underline font-bold text-[11px]">
                                  🖨️ Imprimir
                                </button>
                              </td>
                            </tr>
                          `).join('')}
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              `
                ).join('');
              })()}
            </tbody>
          </table>
        </div>
        ${(() => {
          const invPag = window.MartelaUI.paginate(masterList, currentPage, pageSize);
          return window.MartelaUI.renderPaginationControls({
            totalItems: invPag.totalItems,
            currentPage: invPag.currentPage,
            pageSize: invPag.pageSize,
            totalPages: invPag.totalPages,
            startIdx: invPag.startIdx,
            endIdx: invPag.endIdx,
            onPageChange: 'MartelaInventory.goToPage',
            onPageSizeChange: 'MartelaInventory.setPageSize',
            itemName: 'modelos en bóveda'
          });
        })()}
      </div>
    `;
  }

  async function goToPage(page) {
    currentPage = page;
    await window.MartelaUI.flashLoading('Cargando existencias de Bóveda...', 180);
    render(document.getElementById('contentContainer'));
  }

  async function setPageSize(size) {
    pageSize = size;
    currentPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' modelos por página...', 220);
    render(document.getElementById('contentContainer'));
  }

  /**
   * Abre la Mesa de Pesaje Rápido Continuo dentro de un Modal Ergonómico
   */
  async function openWeighModal(preselectedSku = null) {
    const gavetas = await window.apiFacade.getGavetas();
    const db = window.apiFacade._getDB();
    const { esc } = window.MartelaUI;

    const modalHtml = `
      <form id="fastScaleForm" onsubmit="MartelaInventory.handleFastWeighSubmit(event)" class="space-y-6">
        <!-- Banner Técnico Superior -->
        <div class="text-xs text-slate-600 dark:text-slate-300 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
            <span class="font-bold text-amber-600 dark:text-amber-400">Balanza Analítica en Vivo (0.0000 g):</span>
            <span>Deducción de pedrería y cálculo de ley 24K en tiempo real.</span>
          </div>
          <span class="font-mono text-[11px] text-slate-500 dark:text-slate-400">
            Atajo: <kbd class="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-amber-500 font-bold font-mono">Enter ↵</kbd>
          </span>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Columna 1: Parámetros del Producto y Ubicación (5 cols) -->
          <div class="lg:col-span-5 space-y-4">
            <div>
              <label class="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                1. Seleccionar Modelo / SKU 14 Dígitos
              </label>
              <select id="scaleSkuSelect" onchange="MartelaInventory.onScaleInputChanged()" class="font-mono font-bold w-full text-xs">
                ${db.products_sku.map(p => `
                  <option value="${esc(p.sku)}" ${preselectedSku === p.sku ? 'selected' : ''} data-cz="${Number(p.peso_piedra_cz || 0).toFixed(4)}" data-factor="${Number(p.factor_oro_fino || 0.41667).toFixed(5)}" data-sku14="${esc(p.sku_14)}" data-modelo="${esc(p.modelo_martela)}">
                    ${esc(p.sku_14)} · ${esc(p.modelo_martela)} (${esc(p.quilataje)} | CZ: -${Number(p.peso_piedra_cz || 0).toFixed(4)}g)
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                2. Ubicación Física Jerárquica (Almacén → Rack → Nivel → Gaveta)
              </label>
              <select id="scaleGavetaSelect" class="font-mono w-full text-xs">
                ${gavetas.map(g => `
                  <option value="${esc(g.codigo_completo)}">
                    🗄️ ${esc(g.codigo_completo)} — ${esc(g.descripcion)}
                  </option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                3. Peso Bruto en Platillo de Báscula (g · 4 decimales)
              </label>
              <div class="flex gap-2">
                <input
                  id="scaleBrutoInput"
                  type="number"
                  step="0.0001"
                  min="0.0500"
                  value="1.8940"
                  required
                  oninput="MartelaInventory.onScaleInputChanged()"
                  class="font-mono text-base font-black text-amber-600 dark:text-amber-400 flex-1 px-3 py-2 border rounded-xl"
                  placeholder="0.0000"
                />
                <button type="button" onclick="MartelaInventory.simulateRandomScaleReading()" class="btn btn-soft whitespace-nowrap text-xs flex items-center gap-1.5 px-3">
                  <span>🎲</span> Pesar Otra
                </button>
              </div>
            </div>
          </div>

          <!-- Columna 2: Display Digital Gigante de Báscula y Ecuación (7 cols) -->
          <div class="lg:col-span-7 space-y-4">
            <!-- Visor LCD de Báscula -->
            <div class="p-5 rounded-2xl bg-slate-950 border-2 border-slate-800 shadow-inner text-white">
              <div class="flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase mb-1">
                <span class="flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ● BÁSCULA METTLER TOLEDO · ESTABLE
                </span>
                <span id="scaleLiveSkuBadge" class="text-amber-400">SKU: 07502278209688</span>
              </div>

              <div class="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800 pb-3">
                <div class="text-xs text-slate-400 uppercase font-bold">Lectura Peso Bruto:</div>
                <div id="scaleLcdBruto" class="text-4xl md:text-5xl font-black font-mono tracking-wider text-emerald-400">
                  1.8940 <span class="text-xl text-slate-400">g</span>
                </div>
              </div>

              <!-- Ecuación en Tiempo Real: Bruto (-) CZ (=) Neto (=>) Oro Fino -->
              <div class="grid grid-cols-3 gap-2.5 pt-3 text-center font-mono">
                <div class="p-2.5 rounded-xl bg-slate-900 border border-cyan-500/30">
                  <div class="text-[10px] text-cyan-400 uppercase leading-tight">(-) Piedra CZ</div>
                  <div id="scaleLcdCz" class="text-sm sm:text-base font-bold text-cyan-300 mt-0.5">-0.1800 g</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900 border border-amber-500/40">
                  <div class="text-[10px] text-amber-400 uppercase leading-tight">(=) Peso Neto Metal</div>
                  <div id="scaleLcdNeto" class="text-sm sm:text-base font-black text-amber-400 mt-0.5">1.7140 g</div>
                </div>
                <div class="p-2.5 rounded-xl bg-slate-900 border border-yellow-500/40">
                  <div class="text-[10px] text-yellow-300 uppercase leading-tight">(=&gt;) Oro Fino 24K</div>
                  <div id="scaleLcdFino" class="text-sm sm:text-base font-black text-yellow-300 mt-0.5">0.71417 g</div>
                </div>
              </div>
            </div>

            <!-- Botones de Acción del Modal -->
            <div class="flex flex-col sm:flex-row justify-end gap-2 pt-2">
              <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft text-xs py-2.5 px-4 order-2 sm:order-1">
                Cancelar
              </button>
              <button type="submit" class="btn btn-gold py-2.5 px-6 text-sm font-bold shadow-lg flex items-center justify-center gap-2 order-1 sm:order-2">
                <span>🏷️</span> Grabar Pieza &amp; Imprimir Etiqueta Térmica (Enter ↵)
              </button>
            </div>
          </div>
        </div>

        <!-- Historial rápido de la sesión dentro del modal -->
        ${sessionWeighedPieces.length > 0 ? `
          <div class="pt-3 border-t border-slate-200 dark:border-slate-800">
            <div class="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Últimas sub-piezas pesadas en esta sesión:
            </div>
            <div class="flex flex-wrap gap-2">
              ${sessionWeighedPieces.slice(0, 4).map(p => `
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <span class="font-bold text-amber-600 dark:text-amber-400">${esc(p.piece_id)}</span>
                  <span>${Number(p.peso_neto_metal_g).toFixed(4)}g netos</span>
                  <span class="text-slate-400 text-[10px]">(${esc(p.ubicacion_gaveta)})</span>
                </span>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </form>
    `;

    window.MartelaUI.openModal(
      'Mesa de Pesaje Rápido Continuo · Terminal Báscula Digital',
      modalHtml,
      'max-w-4xl',
      () => {
        onScaleInputChanged();
      }
    );
  }

  function onScaleInputChanged() {
    const sel = document.getElementById('scaleSkuSelect');
    if (!sel) return;
    const opt = sel.options[sel.selectedIndex];
    const cz = parseFloat(opt?.dataset.cz || '0.1800');
    const factor = parseFloat(opt?.dataset.factor || '0.41667');
    const sku14 = opt?.dataset.sku14 || '07502278209688';

    const bruto = parseFloat(document.getElementById('scaleBrutoInput')?.value || '0');
    const neto = Math.max(0, bruto - cz);
    const fino = neto * factor;

    const badgeEl = document.getElementById('scaleLiveSkuBadge');
    const brutoEl = document.getElementById('scaleLcdBruto');
    const czEl = document.getElementById('scaleLcdCz');
    const netoEl = document.getElementById('scaleLcdNeto');
    const finoEl = document.getElementById('scaleLcdFino');

    if (badgeEl) badgeEl.textContent = `SKU: ${sku14} · Factor Au: ${factor.toFixed(5)}`;
    if (brutoEl) brutoEl.innerHTML = `${bruto.toFixed(4)} <span class="text-xl text-slate-400">g</span>`;
    if (czEl) czEl.textContent = `-${cz.toFixed(4)} g`;
    if (netoEl) netoEl.textContent = `${neto.toFixed(4)} g`;
    if (finoEl) finoEl.textContent = `${fino.toFixed(5)} g`;
  }

  function simulateRandomScaleReading() {
    const sel = document.getElementById('scaleSkuSelect');
    const opt = sel?.options[sel.selectedIndex];
    const cz = parseFloat(opt?.dataset.cz || '0.1800');
    const randomMetal = 1.65 + Math.random() * 2.85;
    const simulatedBruto = (randomMetal + cz).toFixed(4);
    const input = document.getElementById('scaleBrutoInput');
    if (input) {
      input.value = simulatedBruto;
      onScaleInputChanged();
      input.focus();
    }
  }

  async function handleFastWeighSubmit(e) {
    e.preventDefault();
    const btn = document.querySelector('#fastScaleForm button[type="submit"]');
    window.MartelaUI.setButtonLoading(btn, true, 'Grabando & Imprimiendo...');

    const sku = document.getElementById('scaleSkuSelect')?.value;
    const gaveta = document.getElementById('scaleGavetaSelect')?.value;
    const pesoBruto = parseFloat(document.getElementById('scaleBrutoInput')?.value || '0');

    try {
      await new Promise(r => setTimeout(r, 200));
      const piece = await window.apiFacade.weighIndividualSubPiece({
        sku,
        ubicacion_gaveta: gaveta,
        peso_bruto_g: pesoBruto
      });
      sessionWeighedPieces.unshift(piece);
      window.MartelaUI.toast(
        `Sub-pieza ${piece.piece_id} grabada (${piece.peso_neto_metal_g.toFixed(4)}g netos | ${piece.gramos_oro_fino.toFixed(5)}g Au Fino) en ${piece.ubicacion_gaveta}`,
        'success'
      );
      // Actualiza la tabla máster en segundo plano
      await render(document.getElementById('contentContainer'));
      // Abre la etiqueta térmica de la pieza recién grabada
      openThermalLabelModal(piece.piece_id);
    } catch (err) {
      window.MartelaUI.setButtonLoading(btn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function openThermalLabelModal(pieceId) {
    const db = window.apiFacade._getDB();
    const p = db.inventory_pieces.find(x => x.piece_id === pieceId) || db.inventory_pieces[0];
    const prod = db.products_sku.find(x => x.sku === p.sku_ref) || db.products_sku[0];
    const { esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4">
        <div class="p-6 rounded-2xl bg-white text-slate-950 border-2 border-dashed border-slate-400 max-w-sm mx-auto font-mono shadow-inner">
          <div class="flex justify-between items-center border-b border-slate-300 pb-2 mb-2">
            <span class="font-black text-sm tracking-widest">MARTELA · JOYERÍA</span>
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-400">${esc(prod.quilataje)}</span>
          </div>
          <div class="text-xs font-bold">${esc(prod.modelo_martela || prod.sku)} — ${esc(p.piece_id)}</div>
          <div class="text-[11px] text-slate-600 truncate">${esc(prod.descripcion)}</div>
          <div class="my-3 py-2 bg-slate-100 rounded text-center">
            <div class="text-[10px] tracking-[0.28em] font-black">|||| |||| || ||||| |||| |||</div>
            <div class="text-xs font-bold mt-0.5">${esc(p.sku_14 || prod.sku_14)}</div>
          </div>
          <div class="grid grid-cols-3 gap-1 text-[11px] border-t border-slate-200 pt-2">
            <div>Bruto:<br><b>${Number(p.peso_bruto_g).toFixed(4)}g</b></div>
            <div>Piedra CZ:<br><b>-${Number(p.peso_piedra_g || 0).toFixed(4)}g</b></div>
            <div>Neto Metal:<br><b>${Number(p.peso_neto_metal_g ?? p.peso_neto_g).toFixed(4)}g</b></div>
          </div>
          <div class="mt-2 pt-2 border-t border-slate-200 flex justify-between text-[10px]">
            <span>Gaveta: <b>${esc(p.ubicacion_gaveta || 'BOVEDA-R1-N1-G01')}</b></span>
            <span>Au Fino: <b>${Number(p.gramos_oro_fino || 0).toFixed(5)}g</b></span>
          </div>
        </div>
        <div class="flex justify-between items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
          <button onclick="MartelaInventory.openWeighModal('${prod.sku}')" class="btn btn-soft text-xs flex items-center gap-1.5">
            <span>⚖️</span> Pesar Siguiente Pieza
          </button>
          <div class="flex gap-2">
            <button onclick="MartelaUI.closeModal()" class="btn btn-soft text-xs">Cerrar</button>
            <button onclick="window.print()" class="btn btn-gold text-xs">🖨️ Enviar a Zebra ZT230</button>
          </div>
        </div>
      </div>
    `;
    window.MartelaUI.openModal(`Etiqueta Térmica Zebra · ${p.piece_id}`, html, 'max-w-md');
  }

  function toggleSubTable(sku) {
    const row = document.getElementById(`subrow-${sku}`);
    if (row) row.classList.toggle('hidden');
  }

  function onSearch(val) {
    currentFilters.query = val;
    render(document.getElementById('contentContainer'));
  }

  async function exportExcel() {
    await window.MartelaUI.withLoading('Exportando existencias de Bóveda y sub-piezas a Excel...', async () => {
      const db = window.apiFacade._getDB();
      const rows = db.inventory_pieces.map(p => ({
        Serial_Subpieza: p.piece_id,
        SKU_14_Digitos: p.sku_14 || p.sku_ref,
        Modelo_Martela: p.modelo_martela || p.sku_ref,
        Gaveta_Fisica: p.ubicacion_gaveta || 'BOVEDA-R1-N1-G01',
        Peso_Bruto_g: Number(p.peso_bruto_g).toFixed(4),
        Descuento_Piedra_CZ_g: Number(p.peso_piedra_g || 0).toFixed(4),
        Peso_Neto_Metal_g: Number(p.peso_neto_metal_g ?? p.peso_neto_g).toFixed(4),
        Gramos_Oro_Fino_24K: Number(p.gramos_oro_fino || 0).toFixed(5),
        Estatus: p.estatus
      }));
      window.MartelaUI.exportToExcel(rows, 'martela-inventario-subpiezas-gavetas.xlsx', 'Subpiezas_Boveda');
    });
  }

  return {
    render,
    openWeighModal,
    onScaleInputChanged,
    simulateRandomScaleReading,
    handleFastWeighSubmit,
    openThermalLabelModal,
    toggleSubTable,
    goToPage,
    setPageSize,
    onSearch,
    exportExcel
  };
})();
