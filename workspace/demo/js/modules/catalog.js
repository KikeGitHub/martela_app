/**
 * MARTELA — MÓDULO 1 SDOP: Catálogo Maestro Multi-Proveedor y Matriz de Circonias (CZ)
 * 
 * Enriquecido con el libro oficial: "ALTAS Y SKUS DE MODELOS PROVEEDORES 02-03-26.xlsx"
 * - 39 Proveedores y Talleres (Internacionales: Turquía, China, Italia, Hong Kong, India, Tailandia, etc. | Nacionales: GDL, Taxco, CDMX).
 * - 2,231+ Modelos y SKUs oficiales de 14 dígitos (GTIN-14) con deducción paramétrica de Circonias (CZ).
 * - Arquitectura Modal-First CRUD, Paginación Ágil (50 items/pág) y Concentrado Maestro de Proveedores.
 */
window.MartelaCatalog = (function() {
  let debounceTimer = null;
  let currentSubTab = 'productos'; // 'productos' | 'proveedores'
  let currentPage = 1;
  let pageSize = 20;
  let supplierPage = 1;
  let supplierPageSize = 20;

  let state = {
    query: '',
    metal_tipo: '',
    id_proveedor: '',
    categoria: '',
    proveedor_query: ''
  };

  function getMetalBadge(metalTipo) {
    if (metalTipo === 'ORO_14K' || metalTipo === '14K') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 shadow-sm">◈ Oro 14K (0.58333)</span>`;
    }
    if (metalTipo === 'ORO_10K' || metalTipo === '10K') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-400/40">◈ Oro 10K (0.41667)</span>`;
    }
    if (metalTipo === 'PLATA_925' || metalTipo === '.925' || metalTipo === '925') {
      return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border border-slate-400/40">◈ Plata .925 (Margen)</span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-200 text-amber-900">◈ ${metalTipo || 'Joyería'}</span>`;
  }

  function getCzChip(pesoCz) {
    const val = Number(pesoCz || 0);
    if (val <= 0) {
      return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-400">Sin piedra (0.0000 g)</span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 shadow-sm">💎 -${val.toFixed(4)} g CZ</span>`;
  }

  function getFlagEmoji(pais) {
    const p = String(pais || '').toUpperCase();
    if (p.includes('CHINA')) return '🇨🇳';
    if (p.includes('HONG KONG')) return '🇭🇰';
    if (p.includes('ITALIA')) return '🇮🇹';
    if (p.includes('TURQU') || p.includes('TURQUÍA')) return '🇹🇷';
    if (p.includes('MEX') || p.includes('MÉXICO')) return '🇲🇽';
    if (p.includes('INDIA')) return '🇮🇳';
    if (p.includes('TAILANDIA')) return '🇹🇭';
    if (p.includes('INDONESIA')) return '🇮🇩';
    if (p.includes('ESTADOS UNIDOS') || p.includes('EE.UU.')) return '🇺🇸';
    return '🌐';
  }

  async function render(container) {
    const suppliers = await window.apiFacade.getSuppliers();
    const items = await window.apiFacade.searchProductsCatalog(state.query, {
      metal_tipo: state.metal_tipo,
      id_proveedor: state.id_proveedor
    });
    const { esc } = window.MartelaUI;

    // Conteo de modelos con Circonia
    const conCirconia = items.filter(i => Number(i.peso_piedra_cz) > 0).length;

    container.innerHTML = `
      <!-- Encabezado Módulo 1 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div class="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">
            <span>MÓDULO 1 · ARQUITECTURA SDOP</span>
            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px]">LIBRO OFICIAL 02-03-26</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Catálogo Maestro y Concentrado de Proveedores</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestión integral de 39 proveedores internacionales y nacionales con catálogo de más de 2,200 modelos y calibración milimétrica de circonias (CZ).
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="MartelaCatalog.exportCatalogExcel()" class="btn btn-soft" title="Exportar catálogo completo a formato Excel (.xlsx)">
            <span>📥</span> Exportar Excel (.xlsx)
          </button>
          <button onclick="MartelaCatalog.openModalImportarCZ()" class="btn btn-soft" title="Importar JSON masivo de matrices CZ">
            <span>💎</span> Importar Matriz CZ
          </button>
          <button onclick="MartelaCatalog.openProductModal()" class="btn btn-gold shadow-lg shadow-amber-500/20" title="Dar de alta un nuevo modelo o equivalencia">
            <span class="text-base font-black">＋</span> Registrar Nuevo Modelo
          </button>
        </div>
      </div>

      <!-- Barra de Pestañas Principales del Módulo 1 -->
      <div class="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
        <button
          onclick="MartelaCatalog.switchSubTab('productos')"
          class="py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${currentSubTab === 'productos' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          <span>💎</span>
          <span>Catálogo de Productos y SKUs</span>
          <span class="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
            ${items.length}
          </span>
        </button>

        <button
          onclick="MartelaCatalog.switchSubTab('proveedores')"
          class="py-3 px-5 text-sm font-bold border-b-2 flex items-center gap-2 transition ${currentSubTab === 'proveedores' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          <span>🏢</span>
          <span>Concentrado Maestro de Proveedores y Talleres</span>
          <span class="px-2 py-0.5 rounded-full text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
            ${suppliers.length}
          </span>
        </button>
      </div>

      <!-- Vista 1: Catálogo de Productos y SKUs -->
      <div id="subtab-productos" class="${currentSubTab === 'productos' ? '' : 'hidden'}">
        <!-- KPIs Rápidos del Catálogo -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="panel p-4 border-l-4 border-amber-500">
            <div class="text-xs font-bold uppercase text-slate-400">Total Modelos en Catálogo</div>
            <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${items.length} SKUs activos</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Oro 14K (966) · Plata .925 (838) · Oro 10K (406)</div>
          </div>
          <div class="panel p-4 border-l-4 border-cyan-500">
            <div class="text-xs font-bold uppercase text-slate-400">Modelos con Descuento CZ</div>
            <div class="text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1">${conCirconia} / ${items.length}</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Rango calibrado: 0.0100 g a 1.1200 g</div>
          </div>
          <div class="panel p-4 border-l-4 border-yellow-500">
            <div class="text-xs font-bold uppercase text-slate-400">Factor Oro Fino 14K / 10K</div>
            <div class="text-lg font-black font-mono text-amber-600 dark:text-amber-400 mt-1">0.58333 / 0.41667</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Generado automáticamente por ley de metal</div>
          </div>
          <div class="panel p-4 border-l-4 border-emerald-500">
            <div class="text-xs font-bold uppercase text-slate-400">Estándar Código de Barras</div>
            <div class="text-xl font-black font-mono text-slate-900 dark:text-white mt-1">SKU 14 Dígitos</div>
            <div class="text-[11px] text-emerald-500 font-semibold mt-0.5">Ej. 07502278209688 (GTIN-14)</div>
          </div>
        </div>

        <!-- Filtros y Buscador Predictivo -->
        <div class="panel p-4 mb-6">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div class="md:col-span-5">
              <label class="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                🔍 Buscador Predictivo (SKU 14 Dígitos, Modelo Martela, Código Proveedor o Descripción)
              </label>
              <input
                id="catalogSearchInput"
                type="text"
                placeholder="Escribe ej. 07502278209688, FF-8821-CZ, Anillo Solitario, Italoro..."
                value="${esc(state.query)}"
                oninput="MartelaCatalog.onPredictiveSearch(this.value)"
                class="w-full text-xs font-mono"
              />
            </div>
            <div class="md:col-span-3">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Filtrar por Metal / Ley</label>
              <select onchange="MartelaCatalog.onFilterMetal(this.value)" class="w-full text-xs font-bold">
                <option value="">Todos los Metales (10K, 14K, .925, Acero)</option>
                <option value="ORO_14K" ${state.metal_tipo === 'ORO_14K' ? 'selected' : ''}>Oro 14K (Factor 0.58333)</option>
                <option value="ORO_10K" ${state.metal_tipo === 'ORO_10K' ? 'selected' : ''}>Oro 10K (Factor 0.41667)</option>
                <option value="PLATA_925" ${state.metal_tipo === 'PLATA_925' ? 'selected' : ''}>Plata .925 (Margen 70% + IVA)</option>
              </select>
            </div>
            <div class="md:col-span-4">
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Filtrar por Fabricante / Taller (${suppliers.length})</label>
              <select onchange="MartelaCatalog.onFilterSupplier(this.value)" class="w-full text-xs">
                <option value="">Todos los talleres y proveedores (${suppliers.length})</option>
                ${suppliers.map(s => `
                  <option value="${s.id}" ${String(state.id_proveedor) === String(s.id) ? 'selected' : ''}>
                    [${getFlagEmoji(s.pais_origen)} ${esc(s.pais_origen)}] ${esc(s.razon_social)} (${s.total_modelos || 0} SKUs)
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Tabla Principal de Modelos con Paginación -->
        <div class="panel overflow-hidden mb-8 shadow-sm">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Matriz Maestra de Modelos y Descuento de Pedrería CZ</span>
                <span class="text-xs font-normal text-slate-400">· 4 decimales de precisión</span>
              </h3>
            </div>
            <span class="text-xs font-bold text-amber-500" id="catalogCountLabel">
              ${items.length} modelos encontrados
            </span>
          </div>

          <div class="overflow-x-auto" id="catalogTableWrapper">
            ${renderTableHTML(items)}
          </div>
        </div>
      </div>

      <!-- Vista 2: Concentrado Maestro de Proveedores y Talleres -->
      <div id="subtab-proveedores" class="${currentSubTab === 'proveedores' ? '' : 'hidden'}">
        <!-- Resumen de Proveedores -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div class="panel p-4 border-l-4 border-amber-500">
            <div class="text-xs font-bold uppercase text-slate-400">Directorio de Proveedores Oficiales</div>
            <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${suppliers.length} Proveedores y Talleres</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Suministran a las 50 sucursales y CEDIS de MARTELA</div>
          </div>
          <div class="panel p-4 border-l-4 border-indigo-500">
            <div class="text-xs font-bold uppercase text-slate-400">Proveedores Internacionales (Importación)</div>
            <div class="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">18 Fabricantes Mundiales</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Turquía, China, Italia, Hong Kong, Tailandia, India, Indonesia, EE.UU.</div>
          </div>
          <div class="panel p-4 border-l-4 border-emerald-500">
            <div class="text-xs font-bold uppercase text-slate-400">Talleres Nacionales de Hechura (Maquila)</div>
            <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">21 Talleres Mexicanos</div>
            <div class="text-[11px] text-slate-500 mt-0.5">Guadalajara (Centro Joyero), Taxco de Alarcón, CDMX y León</div>
          </div>
        </div>

        <!-- Tabla de Proveedores y Talleres con Paginación -->
        <div class="panel overflow-hidden mb-8 shadow-sm">
          <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <div>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white">Concentrado Oficial de Proveedores y Talleres</h3>
              <p class="text-xs text-slate-400">Datos consolidados del archivo maestro ALTAS Y SKUS DE MODELOS PROVEEDORES 02-03-26.xlsx</p>
            </div>
            <span class="text-xs font-bold text-amber-500">${suppliers.length} talleres registrados</span>
          </div>

          ${(() => {
            const suppPag = window.MartelaUI.paginate(suppliers, supplierPage, supplierPageSize);
            return `
              <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase font-mono">
                    <tr>
                      <th class="p-3.5">Código / Taller</th>
                      <th class="p-3.5">País y Ciudad de Origen</th>
                      <th class="p-3.5 text-center">Tipo</th>
                      <th class="p-3.5 text-center">Modelos Suministrados</th>
                      <th class="p-3.5">Metales y Quilatajes</th>
                      <th class="p-3.5 text-center">Moneda / Lead Time</th>
                      <th class="p-3.5 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                    ${suppPag.items.map(s => `
                      <tr class="hover:bg-amber-500/5 transition">
                        <td class="p-3.5">
                          <div class="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">${esc(s.codigo_interno)}</div>
                          <div class="font-bold text-slate-900 dark:text-white text-sm mt-0.5">${esc(s.razon_social)}</div>
                          <div class="text-[10px] text-slate-400 font-mono mt-0.5">ID: ${s.id}</div>
                        </td>
                        <td class="p-3.5">
                          <div class="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                            <span class="text-base">${getFlagEmoji(s.pais_origen)}</span>
                            <span>${esc(s.pais_origen)}</span>
                          </div>
                          <div class="text-[11px] text-slate-400">${esc(s.ciudad || 'N/A')}</div>
                        </td>
                        <td class="p-3.5 text-center">
                          <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${s.tipo === 'INTERNACIONAL' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-400/30' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-400/30'}">
                            ${esc(s.tipo || 'NACIONAL')}
                          </span>
                        </td>
                        <td class="p-3.5 text-center font-mono font-black text-slate-900 dark:text-white text-sm">
                          ${s.total_modelos || 0} SKUs
                        </td>
                        <td class="p-3.5">
                          <div class="flex flex-wrap gap-1">
                            ${(s.quilatajes || ['Oro 10K', 'Oro 14K']).map(q => `
                              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                ${esc(q)}
                              </span>
                            `).join('')}
                          </div>
                        </td>
                        <td class="p-3.5 text-center font-mono">
                          <span class="font-bold text-slate-700 dark:text-slate-300">${esc(s.moneda_compra || 'USD')}</span>
                          <div class="text-[10px] text-slate-400">${s.lead_time_dias || 30} días promedio</div>
                        </td>
                        <td class="p-3.5 text-center">
                          <button
                            onclick="MartelaCatalog.filterBySupplierFromTab('${s.id}')"
                            class="btn btn-soft text-xs py-1 px-3 text-amber-600 dark:text-amber-400 font-bold hover:bg-amber-500/10 transition"
                          >
                            🔍 Ver Modelos (${s.total_modelos || 0})
                          </button>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${window.MartelaUI.renderPaginationControls({
                totalItems: suppPag.totalItems,
                currentPage: suppPag.currentPage,
                pageSize: suppPag.pageSize,
                totalPages: suppPag.totalPages,
                startIdx: suppPag.startIdx,
                endIdx: suppPag.endIdx,
                onPageChange: 'MartelaCatalog.goToSupplierPage',
                onPageSizeChange: 'MartelaCatalog.setSupplierPageSize',
                itemName: 'proveedores y talleres'
              })}
            `;
          })()}
        </div>
      </div>
    `;
  }

  function switchSubTab(tabName) {
    currentSubTab = tabName;
    currentPage = 1;
    render(document.getElementById('contentContainer'));
  }

  function filterBySupplierFromTab(supplierId) {
    state.id_proveedor = supplierId;
    currentSubTab = 'productos';
    currentPage = 1;
    render(document.getElementById('contentContainer'));
  }

  function renderTableHTML(items) {
    const { money, esc } = window.MartelaUI;
    if (!items || items.length === 0) {
      return `
        <div class="p-12 text-center text-slate-400">
          <div class="text-3xl mb-2">🔍</div>
          <p class="text-sm font-semibold">No se encontraron modelos con los filtros seleccionados.</p>
          <button onclick="MartelaCatalog.resetFilters()" class="btn btn-soft text-xs mt-3">Limpiar Filtros</button>
        </div>
      `;
    }

    const prodPag = window.MartelaUI.paginate(items, currentPage, pageSize);
    currentPage = prodPag.currentPage;

    return `
      <table class="w-full text-left text-xs">
        <thead class="bg-slate-100 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-semibold font-mono">
          <tr>
            <th class="p-3.5">SKU 14 Dígitos / Modelo Martela</th>
            <th class="p-3.5">Equivalencia Proveedor</th>
            <th class="p-3.5">Descripción &amp; Medida</th>
            <th class="p-3.5">Quilataje &amp; Ley</th>
            <th class="p-3.5 text-center">Descuento Circonia (CZ)</th>
            <th class="p-3.5 text-center">Existencias Físicas</th>
            <th class="p-3.5 text-right">Costo Hechura Base</th>
            <th class="p-3.5 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
          ${prodPag.items.map(item => `
            <tr class="hover:bg-amber-500/5 transition cursor-pointer group" onclick="MartelaCatalog.openProductModal('${esc(item.sku)}')">
              <td class="p-3.5">
                <div class="font-mono font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                  <span class="text-slate-400 text-[10px]">▦</span>
                  <span>${esc(item.sku_14 || item.sku)}</span>
                </div>
                <div class="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">${esc(item.modelo_martela || item.sku)}</div>
              </td>
              <td class="p-3.5">
                <div class="font-mono font-bold text-slate-800 dark:text-slate-200">${esc(item.modelo_proveedor || 'N/A')}</div>
                <div class="text-[11px] text-slate-400 truncate max-w-[180px]">[${getFlagEmoji(item.pais_origen)} ${esc(item.pais_origen)}] ${esc(item.proveedor_nombre)}</div>
              </td>
              <td class="p-3.5">
                <div class="font-semibold text-slate-900 dark:text-white">${esc(item.descripcion)}</div>
                <div class="text-[11px] text-slate-400">Tipo: ${esc(item.tipo_alhaja || item.categoria)} · Medida: ${esc(item.medida || 'Estándar')}</div>
              </td>
              <td class="p-3.5">
                ${getMetalBadge(item.metal_tipo)}
              </td>
              <td class="p-3.5 text-center">
                ${getCzChip(item.peso_piedra_cz)}
              </td>
              <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                ${item.piezas_disponibles > 0 ? `
                  <button
                    type="button"
                    onclick="MartelaCatalog.openStockModal('${esc(item.sku)}')"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-100 transition shadow-sm"
                    title="Ver desglose por gaveta física en bóveda"
                  >
                    <span>🗄️</span> <span>${item.piezas_disponibles} pzs</span>
                  </button>
                  <div class="text-[10px] text-slate-400 font-mono mt-0.5">${Number(item.peso_neto_total_g || 0).toFixed(2)} g netos</div>
                ` : `
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 font-mono">
                    0 pzs
                  </span>
                `}
              </td>
              <td class="p-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                ${money(item.costo_mo_base || item.costo_hechura_base || 185)}
              </td>
              <td class="p-3.5 text-center" onclick="event.stopPropagation()">
                <div class="flex items-center justify-center gap-1.5">
                  <button
                    type="button"
                    onclick="MartelaCatalog.openProductModal('${esc(item.sku)}')"
                    class="btn btn-soft py-1 px-2.5 text-xs text-amber-600 dark:text-amber-400 hover:border-amber-500 font-bold"
                    title="Editar producto en modal"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onclick="MartelaCatalog.handleDeleteProduct('${esc(item.sku)}', '${esc(item.modelo_martela)}')"
                    class="btn btn-soft py-1 px-2 text-xs text-rose-500 hover:bg-rose-500/10 hover:border-rose-500"
                    title="Eliminar de catálogo"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      ${window.MartelaUI.renderPaginationControls({
        totalItems: prodPag.totalItems,
        currentPage: prodPag.currentPage,
        pageSize: prodPag.pageSize,
        totalPages: prodPag.totalPages,
        startIdx: prodPag.startIdx,
        endIdx: prodPag.endIdx,
        onPageChange: 'MartelaCatalog.goToPage',
        onPageSizeChange: 'MartelaCatalog.setPageSize',
        itemName: 'modelos en catálogo'
      })}
    `;
  }

  async function goToPage(page) {
    currentPage = page;
    await window.MartelaUI.flashLoading('Cargando registros de página ' + page + '...', 180);
    const wrapper = document.getElementById('catalogTableWrapper');
    if (wrapper) {
      const items = await window.apiFacade.searchProductsCatalog(state.query, {
        metal_tipo: state.metal_tipo,
        id_proveedor: state.id_proveedor
      });
      wrapper.innerHTML = renderTableHTML(items);
      wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  async function setPageSize(size) {
    pageSize = size;
    currentPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' registros por página...', 220);
    const wrapper = document.getElementById('catalogTableWrapper');
    if (wrapper) {
      const items = await window.apiFacade.searchProductsCatalog(state.query, {
        metal_tipo: state.metal_tipo,
        id_proveedor: state.id_proveedor
      });
      wrapper.innerHTML = renderTableHTML(items);
    }
  }

  async function goToSupplierPage(page) {
    supplierPage = page;
    await window.MartelaUI.flashLoading('Cargando página de talleres...', 180);
    render(document.getElementById('contentContainer'));
  }

  async function setSupplierPageSize(size) {
    supplierPageSize = size;
    supplierPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' proveedores por página...', 220);
    render(document.getElementById('contentContainer'));
  }

  function onPredictiveSearch(val) {
    state.query = val;
    currentPage = 1;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(async () => {
      const items = await window.apiFacade.searchProductsCatalog(state.query, {
        metal_tipo: state.metal_tipo,
        id_proveedor: state.id_proveedor
      });
      const wrapper = document.getElementById('catalogTableWrapper');
      const countLbl = document.getElementById('catalogCountLabel');
      if (wrapper) wrapper.innerHTML = renderTableHTML(items);
      if (countLbl) countLbl.textContent = `${items.length} modelos encontrados`;
    }, 300);
  }

  function onFilterMetal(val) {
    state.metal_tipo = val;
    currentPage = 1;
    onPredictiveSearch(state.query);
  }

  function onFilterSupplier(val) {
    state.id_proveedor = val;
    currentPage = 1;
    onPredictiveSearch(state.query);
  }

  function resetFilters() {
    state.query = '';
    state.metal_tipo = '';
    state.id_proveedor = '';
    currentPage = 1;
    const input = document.getElementById('catalogSearchInput');
    if (input) input.value = '';
    render(document.getElementById('contentContainer'));
  }

  /**
   * MODAL CRUD: ALTA Y EDICIÓN DE PRODUCTO / MATRIZ CZ
   */
  async function openProductModal(sku = null) {
    const suppliers = await window.apiFacade.getSuppliers();
    const db = window.apiFacade._getDB();
    const { esc } = window.MartelaUI;

    let item = null;
    let isEdit = false;

    if (sku) {
      item = db.products_sku.find(p => p.sku === sku || p.sku_14 === sku);
      if (item) isEdit = true;
    }

    // Valores por defecto
    const defaultSku14 = isEdit ? (item.sku_14 || item.sku) : `07502278${String(Math.floor(100000 + Math.random() * 900000))}`;
    const defaultModMartela = isEdit ? (item.modelo_martela || item.sku) : 'MRT-AN-8050';
    const defaultModProv = isEdit ? (item.modelo_proveedor || '') : 'FF-2026-CZ9';
    const defaultIdProv = isEdit ? (item.id_proveedor || 1) : 1;
    const defaultDesc = isEdit ? (item.descripcion || '') : 'Anillo Fino con Halo de Circonias Suizas';
    const defaultMetal = isEdit ? (item.metal_tipo || 'ORO_14K') : 'ORO_14K';
    const defaultTipo = isEdit ? (item.tipo_alhaja || item.categoria || 'ANILLO') : 'ANILLO';
    const defaultMedida = isEdit ? (item.medida || 'No. 7.5') : 'No. 7.5';
    const defaultMo = isEdit ? Number(item.costo_mo_base || item.costo_hechura_base || 245) : 245;
    const defaultCz = isEdit ? Number(item.peso_piedra_cz || 0).toFixed(4) : '0.1800';

    const modalTitle = isEdit
      ? `✏️ Editar Modelo Joyero: ${esc(defaultModMartela)} (${esc(defaultSku14)})`
      : '＋ Registrar Nueva Alhaja en Catálogo Maestro';

    const html = `
      <form id="modalProductForm" onsubmit="MartelaCatalog.handleSaveProductFromModal(event)" class="space-y-4">
        <input type="hidden" name="original_sku" value="${esc(isEdit ? item.sku : '')}" />
        
        <!-- Fila 1: Identificadores Oficiales -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div class="flex justify-between items-center mb-1">
              <label class="text-xs font-bold text-slate-700 dark:text-slate-300">SKU 14 Dígitos (Código Barras)</label>
              <button type="button" onclick="MartelaCatalog.generateRandomSku14()" class="text-[11px] text-amber-600 dark:text-amber-400 font-semibold hover:underline">🎲 Generar 14 Dígitos</button>
            </div>
            <input
              id="mf_sku_14"
              name="sku_14"
              maxlength="14"
              pattern="[0-9]{14}"
              placeholder="07502278209888"
              value="${esc(defaultSku14)}"
              required
              class="font-mono font-bold w-full"
            />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Modelo Interno MARTELA</label>
            <input
              id="mf_modelo_martela"
              name="modelo_martela"
              placeholder="MRT-AN-8050"
              value="${esc(defaultModMartela)}"
              required
              class="font-mono font-bold uppercase w-full"
            />
          </div>
        </div>

        <!-- Fila 2: Equivalencia con Proveedor -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Proveedor / Taller Origen</label>
            <select id="mf_id_proveedor" name="id_proveedor" class="w-full text-xs">
              ${suppliers.map(s => `
                <option value="${s.id}" ${String(defaultIdProv) === String(s.id) ? 'selected' : ''}>
                  [${getFlagEmoji(s.pais_origen)} ${esc(s.pais_origen)}] ${esc(s.razon_social)}
                </option>
              `).join('')}
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Código / Item ID Proveedor</label>
            <input
              id="mf_modelo_proveedor"
              name="modelo_proveedor"
              placeholder="FF-2026-CZ9"
              value="${esc(defaultModProv)}"
              required
              class="font-mono w-full"
            />
          </div>
        </div>

        <!-- Fila 3: Descripción Comercial -->
        <div>
          <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Descripción Comercial de la Alhaja</label>
          <input
            id="mf_descripcion"
            name="descripcion"
            placeholder="Ej. Anillo Solitario Imperial con Circonia Suiza"
            value="${esc(defaultDesc)}"
            required
            class="w-full"
          />
        </div>

        <!-- Fila 4: Metal & Ley, Tipo de Alhaja, Medida -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Metal &amp; Ley</label>
            <select id="mf_metal_tipo" name="metal_tipo" class="w-full">
              <option value="ORO_14K" ${defaultMetal === 'ORO_14K' ? 'selected' : ''}>Oro 14K (Factor 0.58333)</option>
              <option value="ORO_10K" ${defaultMetal === 'ORO_10K' ? 'selected' : ''}>Oro 10K (Factor 0.41667)</option>
              <option value="PLATA_925" ${defaultMetal === 'PLATA_925' ? 'selected' : ''}>Plata .925 (Factor 0.00000)</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Tipo de Alhaja</label>
            <select id="mf_tipo_alhaja" name="tipo_alhaja" class="w-full">
              <option value="ANILLO" ${defaultTipo === 'ANILLO' ? 'selected' : ''}>Anillo</option>
              <option value="CADENA" ${defaultTipo === 'CADENA' ? 'selected' : ''}>Cadena</option>
              <option value="PULSERA" ${defaultTipo === 'PULSERA' ? 'selected' : ''}>Pulsera</option>
              <option value="ESCLAVA" ${defaultTipo === 'ESCLAVA' ? 'selected' : ''}>Esclava</option>
              <option value="ARETE" ${defaultTipo === 'ARETE' ? 'selected' : ''}>Arete / Arrancada</option>
              <option value="DIJE" ${defaultTipo === 'DIJE' ? 'selected' : ''}>Dije / Medalla</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Medida / Talla</label>
            <input id="mf_medida" name="medida" value="${esc(defaultMedida)}" placeholder="Ej. No. 7.5" required class="w-full" />
          </div>
        </div>

        <!-- Fila 5: Costo M.O. y Descuento Circonia CZ -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Costo Hechura / M.O. (MXN)</label>
            <input
              id="mf_costo_mo_base"
              name="costo_mo_base"
              type="number"
              step="0.01"
              min="0"
              value="${defaultMo}"
              required
              class="font-mono font-bold w-full"
            />
            <span class="text-[10px] text-slate-400">Renglón 1 de facturación bipartita</span>
          </div>
          <div>
            <label class="text-xs font-bold text-cyan-700 dark:text-cyan-400 block mb-1">
              💎 Peso Circonia CZ a Descontar (g)
            </label>
            <input
              id="mf_peso_piedra_cz"
              name="peso_piedra_cz"
              type="number"
              step="0.0001"
              min="0"
              max="5.0000"
              value="${defaultCz}"
              required
              class="font-mono font-bold text-cyan-700 dark:text-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/20 border-cyan-500/40 w-full"
            />
            <span class="text-[10px] text-slate-400">Se resta automáticamente en báscula</span>
          </div>
        </div>

        <!-- Atajos Rápidos de Circonia -->
        <div class="p-2.5 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-500/20 flex flex-wrap items-center justify-between gap-2">
          <span class="text-[11px] font-bold text-cyan-800 dark:text-cyan-300">Atajos rápidos CZ:</span>
          <div class="flex flex-wrap gap-1.5">
            <button type="button" onclick="MartelaCatalog.setQuickCz(0.0000)" class="px-2 py-0.5 text-xs font-mono rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-500">0.0000g (Sin piedra)</button>
            <button type="button" onclick="MartelaCatalog.setQuickCz(0.1800)" class="px-2 py-0.5 text-xs font-mono rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-500">0.1800g (Solitario)</button>
            <button type="button" onclick="MartelaCatalog.setQuickCz(0.3600)" class="px-2 py-0.5 text-xs font-mono rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-500">0.3600g (Halo)</button>
            <button type="button" onclick="MartelaCatalog.setQuickCz(0.7200)" class="px-2 py-0.5 text-xs font-mono rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-500">0.7200g (Pavé)</button>
            <button type="button" onclick="MartelaCatalog.setQuickCz(1.1200)" class="px-2 py-0.5 text-xs font-mono rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:border-cyan-500">1.1200g (Pesado)</button>
          </div>
        </div>

        <!-- Acciones Inferiores -->
        <div class="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center gap-3">
          <div>
            ${isEdit ? `
              <button
                type="button"
                onclick="MartelaCatalog.handleDeleteProduct('${esc(item.sku)}', '${esc(item.modelo_martela)}')"
                class="btn btn-soft text-rose-500 hover:bg-rose-500/10 border-rose-500/30 text-xs"
              >
                🗑️ Eliminar
              </button>
            ` : '<span class="text-xs text-slate-400">Todos los campos son requeridos.</span>'}
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">
              Cancelar
            </button>
            <button type="submit" id="modalSaveProductBtn" class="btn btn-gold px-6 shadow-md shadow-amber-500/20">
              💾 Guardar Modelo
            </button>
          </div>
        </div>
      </form>
    `;

    window.MartelaUI.openModal(modalTitle, html, 'max-w-2xl', () => {
      const firstInput = document.getElementById('mf_modelo_martela');
      if (firstInput) firstInput.focus();
    });
  }

  function setQuickCz(val) {
    const input = document.getElementById('mf_peso_piedra_cz');
    if (input) {
      input.value = Number(val).toFixed(4);
    }
  }

  function generateRandomSku14() {
    const randomSuffix = String(Math.floor(100000 + Math.random() * 900000));
    const input = document.getElementById('mf_sku_14');
    if (input) {
      input.value = `07502278${randomSuffix}`;
      window.MartelaUI.toast(`SKU generado: ${input.value}`, 'info');
    }
  }

  async function handleSaveProductFromModal(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = document.getElementById('modalSaveProductBtn');
    window.MartelaUI.setButtonLoading(submitBtn, true, 'Guardando en Catálogo...');

    const data = {
      sku: form.modelo_martela.value.trim().toUpperCase(),
      sku_14: form.sku_14.value.trim(),
      modelo_martela: form.modelo_martela.value.trim().toUpperCase(),
      modelo_proveedor: form.modelo_proveedor.value.trim().toUpperCase(),
      id_proveedor: Number(form.id_proveedor.value),
      descripcion: form.descripcion.value.trim(),
      metal_tipo: form.metal_tipo.value,
      tipo_alhaja: form.tipo_alhaja.value,
      medida: form.medida.value.trim(),
      costo_mo_base: parseFloat(form.costo_mo_base.value),
      peso_piedra_cz: parseFloat(form.peso_piedra_cz.value)
    };

    try {
      await new Promise(r => setTimeout(r, 200));
      const saved = await window.apiFacade.saveProductCatalogItem(data);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`SKU ${saved.sku_14} (${saved.modelo_martela}) guardado con CZ -${saved.peso_piedra_cz.toFixed(4)}g`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.setButtonLoading(submitBtn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function handleDeleteProduct(sku, modeloMartela) {
    const confirmed = await window.MartelaUI.confirmModal(
      '¿Eliminar Alhaja del Catálogo?',
      `¿Estás seguro de retirar el modelo "${modeloMartela}" (${sku}) del Catálogo Maestro? No aparecerá en báscula ni en remisiones de venta.`,
      'Sí, Eliminar de Catálogo',
      true
    );
    if (!confirmed) return;

    try {
      await window.apiFacade.deleteProductCatalogItem(sku);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Modelo ${modeloMartela} eliminado del catálogo maestro`, 'info');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function openStockModal(sku) {
    const pieces = await window.apiFacade.getPiecesBySku(sku);
    const db = window.apiFacade._getDB();
    const prod = db.products_sku.find(p => p.sku === sku || p.sku_14 === sku);
    const { esc, badge } = window.MartelaUI;

    const html = `
      <div class="space-y-4">
        <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
          <div>
            <div class="font-mono font-bold text-amber-600 dark:text-amber-400">${esc(prod?.sku_14 || sku)}</div>
            <div class="font-bold text-slate-800 dark:text-slate-200">${esc(prod?.modelo_martela)} — ${esc(prod?.descripcion)}</div>
          </div>
          <div class="text-right font-mono">
            <div class="font-black text-emerald-600 dark:text-emerald-400 text-sm">${pieces.length} piezas</div>
            <div class="text-[11px] text-slate-400">Total en Bóveda</div>
          </div>
        </div>

        <div class="overflow-x-auto max-h-72">
          <table class="w-full text-left text-xs font-mono">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase sticky top-0">
              <tr>
                <th class="p-2">Serial Pieza</th>
                <th class="p-2">Gaveta Física</th>
                <th class="p-2 text-right">Peso Bruto</th>
                <th class="p-2 text-right">(-) Circonia</th>
                <th class="p-2 text-right">(=) Peso Neto</th>
                <th class="p-2 text-right">Oro Fino 24K</th>
                <th class="p-2 text-center">Estatus</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${pieces.map(p => `
                <tr>
                  <td class="p-2 font-bold text-amber-600 dark:text-amber-400">${esc(p.piece_id)}</td>
                  <td class="p-2">${esc(p.ubicacion_gaveta || 'BOVEDA-R1-N1-G01')}</td>
                  <td class="p-2 text-right">${Number(p.peso_bruto_g).toFixed(4)} g</td>
                  <td class="p-2 text-right text-cyan-600">-${Number(p.peso_piedra_g || prod?.peso_piedra_cz || 0).toFixed(4)} g</td>
                  <td class="p-2 text-right font-bold">${Number(p.peso_neto_metal_g ?? p.peso_neto_g).toFixed(4)} g</td>
                  <td class="p-2 text-right text-amber-600 dark:text-amber-400 font-bold">${Number(p.gramos_oro_fino || 0).toFixed(5)} g</td>
                  <td class="p-2 text-center">${badge(p.estatus)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft text-xs">Cerrar</button>
        </div>
      </div>
    `;

    window.MartelaUI.openModal(`Existencias Físicas en Gaveta · ${prod?.modelo_martela || sku}`, html, 'max-w-2xl');
  }

  function openModalImportarCZ() {
    const sampleJson = JSON.stringify([
      { "sku": "07502278209688", "peso_piedra_cz": 0.1800, "notas": "Anillo Solitario 10K" },
      { "sku": "07502278209718", "peso_piedra_cz": 0.3400, "notas": "Arracada Pavé 14K" }
    ], null, 2);

    const html = `
      <div class="space-y-4">
        <p class="text-xs text-slate-500">
          Pega el JSON con la matriz de calibración de pedrería (SKU y peso exacto de circonia en gramos a 4 decimales):
        </p>
        <textarea id="importCzJsonTextarea" rows="8" class="w-full font-mono text-xs">${sampleJson}</textarea>
        <div class="flex justify-end gap-2">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft text-xs">Cancelar</button>
          <button onclick="MartelaCatalog.processImportCz()" class="btn btn-gold text-xs">⚡ Procesar Actualización Masiva CZ</button>
        </div>
      </div>
    `;
    window.MartelaUI.openModal('Importación Masiva de Matriz CZ', html, 'max-w-lg');
  }

  async function processImportCz() {
    const textarea = document.getElementById('importCzJsonTextarea');
    if (!textarea) return;
    try {
      const data = JSON.parse(textarea.value);
      if (!Array.isArray(data)) throw new Error('El JSON debe ser un arreglo de objetos.');
      const res = await window.apiFacade.importBulkCzMatrix(data);
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Matriz CZ actualizada exitosamente (${res.actualizados} SKUs calibrados)`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(`Error en formato JSON: ${err.message}`, 'error');
    }
  }

  async function exportCatalogExcel() {
    await window.MartelaUI.withLoading('Generando archivo Excel del catálogo con 2,231+ SKUs...', async () => {
      const db = window.apiFacade._getDB();
      const rows = (db.products_sku || []).map((p, idx) => ({
        No: idx + 1,
        SKU_14_Digitos: p.sku_14 || p.sku,
        Modelo_Martela: p.modelo_martela,
        Modelo_Proveedor: p.modelo_proveedor || '',
        Proveedor_Taller: p.proveedor_nombre || '',
        Pais_Origen: p.pais_origen || '',
        Descripcion: p.descripcion,
        Metal_Ley: p.quilataje,
        Tipo_Alhaja: p.categoria || p.tipo_alhaja,
        Medida: p.medida || '',
        Descuento_Circonia_CZ_g: Number(p.peso_piedra_cz || 0).toFixed(4),
        Factor_Oro_Fino: Number(p.factor_oro_fino || 0).toFixed(5),
        Costo_Hechura_MO_MXN: Number(p.costo_mo_base || p.costo_hechura_base || 0).toFixed(2),
        Hoja_Origen_Excel: p.hoja_origen || ''
      }));

      window.MartelaUI.exportToExcel(rows, `martela-catalogo-maestro-2231-skus.xlsx`, 'Catalogo_Maestro');
    });
  }

  return {
    render,
    switchSubTab,
    filterBySupplierFromTab,
    goToPage,
    setPageSize,
    goToSupplierPage,
    setSupplierPageSize,
    onPredictiveSearch,
    onFilterMetal,
    onFilterSupplier,
    resetFilters,
    openProductModal,
    setQuickCz,
    generateRandomSku14,
    handleSaveProductFromModal,
    handleDeleteProduct,
    openStockModal,
    openModalImportarCZ,
    processImportCz,
    exportCatalogExcel
  };
})();
