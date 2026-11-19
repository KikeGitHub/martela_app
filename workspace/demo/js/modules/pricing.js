/**
 * MARTELA — MÓDULO 4 SDOP: Motor Financiero Fix, Oro Fino Puro y Algoritmo de Liquidación Bipartita
 * Reglas contables estrictas:
 * 1. Regla de Tarifa Máxima Fix: max(Fix Hoy, Fix Ayer) con redondeo bancario HALF_UP.
 * 2. Facturación Bipartita: Renglón 1 (Costo M.O. por gramo) + Renglón 2 (Costo Metal por gramo del día).
 * 3. Compensación de Maquila (Montepío): Control de gramos de Oro Fino puro (factor 0.41667 para 10K y 0.58333 para 14K).
 * 4. Plata .925 (Cancún/Santa Fe): Costo base Martela + Margen Comercial (70%) + IVA (16%).
 */
window.MartelaPricing = (function() {
  let compPage = 1;
  let compPageSize = 20;
  async function render(container) {
    const rates = await window.apiFacade.getMetalRates();
    const db = window.apiFacade._getDB();
    const compensations = await window.apiFacade.getMaquilaCompensations();
    const mlsClient = db.clients.find(c => c.id === 'CLI-004') || db.clients[0];
    const { money, esc } = window.MartelaUI;

    const saldoOroFino = Number(mlsClient?.saldo_oro_fino_g ?? 145.80000);

    container.innerHTML = `
      <!-- Encabezado Módulo 4 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div class="text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">MÓDULO DE COTIZACIÓN Y COSTOS</div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Motor Financiero Fix, Oro Fino y Facturación Bipartita</h1>
        </div>
        <button onclick="MartelaPricing.openModalEditarRates()" class="btn btn-gold py-2.5 px-4 font-bold shadow-md">
          <span>⚙</span> Ajustar Fix / Tipo de Cambio
        </button>
      </div>

      <!-- Dashboard Ejecutivo Superior con Tarjetas Financieras -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="panel p-5 border-l-4 border-slate-400">
          <div class="text-xs font-bold text-slate-400 uppercase">FIX Oro Hoy (LBMA)</div>
          <div class="text-2xl font-black font-mono mt-2 text-slate-900 dark:text-white">$${Number(rates.fix_oro_hoy_usd).toFixed(2)} USD</div>
          <div class="text-xs text-slate-500 mt-1">Cotización internacional del día</div>
        </div>

        <div class="panel p-5 border-l-4 border-amber-500">
          <div class="text-xs font-bold text-slate-400 uppercase">FIX Oro Ayer (Cierre)</div>
          <div class="text-2xl font-black font-mono mt-2 text-slate-900 dark:text-white">$${Number(rates.fix_oro_ayer_usd).toFixed(2)} USD</div>
          <div class="text-xs text-slate-500 mt-1">Referencia de protección de margen</div>
        </div>

        <div class="panel p-5 border-l-4 border-blue-500">
          <div class="text-xs font-bold text-slate-400 uppercase">Tipo de Cambio USD/MXN</div>
          <div class="text-2xl font-black font-mono mt-2 text-slate-900 dark:text-white">$${Number(rates.tipo_cambio_usd_mxn).toFixed(4)}</div>
          <div class="text-xs text-slate-500 mt-1">Plata .925 Base: ${money(db.metal_rates.costo_gramo_plata_mxn || 24.80)}/g</div>
        </div>

        <div class="panel p-5 bg-gradient-to-br from-emerald-500/10 to-amber-500/15 border-l-4 border-emerald-500">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500 text-white">TARIFA VIGENTE APLICADA</span>
          </div>
          <div class="text-2xl font-black font-mono mt-2 text-emerald-600 dark:text-emerald-400">$${Number(rates.fix_aplicado_usd).toFixed(2)} USD</div>
          <div class="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">Gramo Au 24K: ${money(rates.precio_gramo_fino_mxn)}</div>
        </div>
      </div>

      <!-- Simulador de Liquidación Bipartita + Cuenta Corriente Maquila -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Simulador Interactivo Bipartito (7 cols) -->
        <div class="lg:col-span-7 panel p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span class="text-amber-500">◇</span>
              <span>Simulador de Liquidación Bipartita (M.O. + Metal + Margen 70% + IVA)</span>
            </h3>
            <span class="text-xs font-mono text-slate-400">RoundingMode.HALF_UP</span>
          </div>

          <form id="bipartiteForm" oninput="MartelaPricing.onCalculateBipartite()" class="space-y-4">
            <div>
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                Seleccionar Pieza Física de Bóveda (auto-carga Peso Bruto, Piedra CZ y Ley)
              </label>
              <select id="bipPieceSelect" onchange="MartelaPricing.onSelectPhysicalPiece(this.value)" class="font-mono">
                <option value="">-- Simulación Manual Paramétrica --</option>
                ${db.inventory_pieces.slice(0, 35).map(p => {
                  const prod = db.products_sku.find(s => s.sku === p.sku_ref) || {};
                  return `
                    <option
                      value="${esc(p.piece_id)}"
                      data-metal="${esc(prod.metal_tipo || 'ORO_14K')}"
                      data-bruto="${Number(p.peso_bruto_g).toFixed(4)}"
                      data-cz="${Number(p.peso_piedra_g ?? prod.peso_piedra_cz ?? 0).toFixed(4)}"
                      data-mo="${Number(prod.costo_mo_base ? (prod.costo_mo_base / Math.max(1, p.peso_neto_g)).toFixed(2) : 68.00)}"
                    >
                      ${esc(p.piece_id)} · ${esc(prod.modelo_martela || p.sku_ref)} (${esc(prod.quilataje || '10K')} | Bruto: ${Number(p.peso_bruto_g).toFixed(4)}g | CZ: -${Number(p.peso_piedra_g ?? 0).toFixed(4)}g)
                    </option>
                  `;
                }).join('')}
              </select>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Metal / Quilataje</label>
                <select id="bipMetalTipo">
                  <option value="ORO_10K">Oro 10K (0.41667)</option>
                  <option value="ORO_14K" selected>Oro 14K (0.58333)</option>
                  <option value="PLATA_925">Plata .925 (Cancún/Sta Fe)</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Peso Bruto (g)</label>
                <input id="bipPesoBruto" type="number" step="0.0001" min="0.1" value="5.3400" class="font-mono" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">(-) Piedra CZ (g)</label>
                <input id="bipPesoCz" type="number" step="0.0001" min="0" value="0.1800" class="font-mono text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Costo M.O. / gramo</label>
                <input id="bipCostoMoGramo" type="number" step="0.50" min="1" value="65.00" class="font-mono" />
              </div>
            </div>

            <!-- Desglose Bipartito Resultante -->
            <div id="bipartiteOutputBox" class="mt-4"></div>
          </form>
        </div>

        <!-- Cuenta Corriente de Oro Fino Puro (Montepío / Maquila) (5 cols) -->
        <div class="lg:col-span-5 panel p-6 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>🏛️</span>
                <span>Cuenta Corriente Maquila (Oro Fino 24K)</span>
              </h3>
              <button onclick="MartelaPricing.openModalMaquila()" class="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                ＋ Abonar / Debitar Au
              </button>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Control de saldos en gramos de Oro Fino Puro (factor <code class="text-amber-500">0.41667</code> para 10K y <code class="text-amber-500">0.58333</code> para 14K) para clientes como Montepío Luz Saviñón.
            </p>

            <div class="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 to-yellow-500/10 border border-amber-500/30 mb-4">
              <div class="text-xs font-bold uppercase text-amber-700 dark:text-amber-300">Saldo Disponible Oro Fino Puro (24K)</div>
              <div class="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">${saldoOroFino.toFixed(5)} g</div>
              <div class="flex justify-between text-xs text-slate-500 mt-2">
                <span>Cliente: Montepío Luz Saviñón</span>
                <span>Equiv: ${money(saldoOroFino * rates.precio_gramo_fino_mxn)}</span>
              </div>
            </div>

            <div class="text-xs font-bold uppercase text-slate-400 mb-2">Bitácora de Movimientos de Oro Fino</div>
            ${(() => {
              const cPag = window.MartelaUI.paginate(compensations, compPage, compPageSize);
              return `
                <div class="overflow-x-auto">
                  <table class="w-full text-xs text-left font-mono">
                    <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                      <tr>
                        <th class="p-2">Folio</th>
                        <th class="p-2">Movimiento</th>
                        <th class="p-2 text-right">Gramos 24K</th>
                        <th class="p-2 text-right">Saldo</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                      ${cPag.items.map(c => `
                        <tr>
                          <td class="p-2 font-bold">${esc(c.id)}</td>
                          <td class="p-2 text-[11px]">${esc(c.tipo_movimiento)}</td>
                          <td class="p-2 text-right font-bold ${c.tipo_movimiento === 'DEBITO_LIQUIDACION' ? 'text-rose-500' : 'text-emerald-500'}">
                            ${c.tipo_movimiento === 'DEBITO_LIQUIDACION' ? '-' : '+'}${Number(c.gramos_oro_fino).toFixed(5)} g
                          </td>
                          <td class="p-2 text-right font-bold text-amber-500">${Number(c.saldo_restante_g || saldoOroFino).toFixed(5)} g</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
                ${window.MartelaUI.renderPaginationControls({
                  totalItems: cPag.totalItems,
                  currentPage: cPag.currentPage,
                  pageSize: cPag.pageSize,
                  totalPages: cPag.totalPages,
                  startIdx: cPag.startIdx,
                  endIdx: cPag.endIdx,
                  onPageChange: 'MartelaPricing.goToCompPage',
                  onPageSizeChange: 'MartelaPricing.setCompPageSize',
                  itemName: 'movimientos 24K'
                })}
              `;
            })()}
          </div>

          <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button type="button" onclick="MartelaPricing.debitSimulatedPieceFromMaquila()" class="btn btn-soft text-xs w-full">
              ⚡ Simular Cargo de Oro Fino de la Pieza Cotizada a Cuenta Maquila
            </button>
          </div>
        </div>
      </div>
    `;

    onCalculateBipartite();
  }

  function onSelectPhysicalPiece(pieceId) {
    if (!pieceId) return;
    const sel = document.getElementById('bipPieceSelect');
    const opt = sel?.options[sel.selectedIndex];
    if (!opt) return;

    document.getElementById('bipMetalTipo').value = opt.dataset.metal || 'ORO_14K';
    document.getElementById('bipPesoBruto').value = opt.dataset.bruto || '2.0000';
    document.getElementById('bipPesoCz').value = opt.dataset.cz || '0.0000';
    document.getElementById('bipCostoMoGramo').value = opt.dataset.mo || '65.00';
    onCalculateBipartite();
  }

  let lastQuoteResult = null;

  async function onCalculateBipartite() {
    const metal_tipo = document.getElementById('bipMetalTipo')?.value || 'ORO_14K';
    const peso_bruto_g = parseFloat(document.getElementById('bipPesoBruto')?.value || '0');
    const peso_piedra_cz = parseFloat(document.getElementById('bipPesoCz')?.value || '0');
    const costo_mo_gramo = parseFloat(document.getElementById('bipCostoMoGramo')?.value || '0');

    const q = await window.apiFacade.calculateBipartiteQuote({
      metal_tipo,
      peso_bruto_g,
      peso_piedra_cz,
      costo_mo_gramo
    });
    lastQuoteResult = q;

    const box = document.getElementById('bipartiteOutputBox');
    if (!box) return;
    const { money } = window.MartelaUI;

    box.innerHTML = `
      <div class="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
        <div class="grid grid-cols-3 gap-2 p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-center">
          <div>
            <span class="text-slate-400 block text-[10px]">PESO BRUTO</span>
            <b class="text-sm">${q.peso_bruto_g.toFixed(4)} g</b>
          </div>
          <div>
            <span class="text-cyan-500 block text-[10px]">(-) PIEDRA CZ</span>
            <b class="text-sm text-cyan-500">-${q.peso_piedra_cz_g.toFixed(4)} g</b>
          </div>
          <div>
            <span class="text-amber-500 block text-[10px]">(=) PESO NETO METAL</span>
            <b class="text-sm text-amber-500">${q.peso_neto_metal_g.toFixed(4)} g</b>
          </div>
        </div>

        <div class="space-y-2 pt-1">
          <div class="flex justify-between items-center p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div>
              <span class="font-bold text-slate-900 dark:text-white">Renglón 1 · Costo Mano de Obra (M.O.)</span>
              <div class="text-[11px] text-slate-400 font-mono">${q.peso_neto_metal_g.toFixed(4)}g × ${money(q.costo_mo_por_gramo)}/g</div>
            </div>
            <span class="font-mono font-bold text-sm text-slate-900 dark:text-white">${money(q.importe_mano_obra)}</span>
          </div>

          <div class="flex justify-between items-center p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20">
            <div>
              <span class="font-bold text-slate-900 dark:text-white">Renglón 2 · Costo Metal del Día (${q.metal_tipo})</span>
              <div class="text-[11px] text-slate-400 font-mono">${q.peso_neto_metal_g.toFixed(4)}g × ${money(q.costo_metal_por_gramo)}/g</div>
            </div>
            <span class="font-mono font-bold text-sm text-slate-900 dark:text-white">${money(q.importe_metal)}</span>
          </div>
        </div>

        <div class="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-1.5">
          <div class="flex justify-between font-bold text-sm">
            <span>Subtotal Facturación Bipartita MARTELA:</span>
            <span class="font-mono text-amber-600 dark:text-amber-400">${money(q.subtotal_martela)}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>(+) Margen Comercial Retail / MLS (70%):</span>
            <span class="font-mono">${money(q.utilidad_cliente_70)}</span>
          </div>
          <div class="flex justify-between text-slate-500">
            <span>(+) IVA Trasladado (16%):</span>
            <span class="font-mono">${money(q.iva_16)}</span>
          </div>
          <div class="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-base font-black">
            <span>Precio Público Sugerido con IVA (Cancún/Sta Fe):</span>
            <span class="font-mono text-emerald-600 dark:text-emerald-400">${money(q.precio_publico_con_iva)}</span>
          </div>
        </div>

        <div class="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 flex justify-between items-center">
          <div>
            <div class="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-300">Gramos Oro Fino Puro a Debitar (Maquila 24K)</div>
            <div class="text-[11px] text-slate-500 font-mono">Peso Neto ${q.peso_neto_metal_g.toFixed(4)}g × Factor ${q.factor_oro_fino.toFixed(5)}</div>
          </div>
          <div class="text-lg font-black font-mono text-amber-600 dark:text-amber-400">
            ${q.gramos_oro_fino_debitar.toFixed(5)} g Au
          </div>
        </div>
      </div>
    `;
  }

  async function debitSimulatedPieceFromMaquila() {
    if (!lastQuoteResult || lastQuoteResult.gramos_oro_fino_debitar <= 0) {
      window.MartelaUI.toast('Selecciona una pieza de Oro 10K o 14K para debitar gramos de oro fino', 'error');
      return;
    }
    await window.apiFacade.registerMaquilaGoldMovement({
      tipo_movimiento: 'DEBITO_LIQUIDACION',
      gramos_oro_fino: lastQuoteResult.gramos_oro_fino_debitar,
      notas: `Cargo por liquidación bipartita (${lastQuoteResult.peso_neto_metal_g.toFixed(4)}g netos)`
    });
    window.MartelaUI.toast(
      `Se debitaron ${lastQuoteResult.gramos_oro_fino_debitar.toFixed(5)} g de Oro Fino de la cuenta maquila`,
      'success'
    );
    render(document.getElementById('contentContainer'));
  }

  function openModalEditarRates() {
    const db = window.apiFacade._getDB();
    const r = db.metal_rates;
    const html = `
      <form onsubmit="MartelaPricing.saveRates(event)" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">FIX Oro Hoy (USD / Oz)</label>
            <input name="fix_hoy" type="number" step="0.01" value="${r.fix_oro_hoy_usd}" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">FIX Oro Ayer (USD / Oz)</label>
            <input name="fix_ayer" type="number" step="0.01" value="${r.fix_oro_ayer_usd}" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Tipo de Cambio (USD/MXN)</label>
            <input name="tc" type="number" step="0.0001" value="${r.tipo_cambio_usd_mxn}" required class="font-mono" />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Aplicar Tarifa Máxima Fix</button>
        </div>
      </form>
    `;
    window.MartelaUI.openModal('Configurar Tasas Internacionales Fix (Hoy vs. Ayer)', html, 'max-w-lg');
  }

  async function saveRates(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    window.MartelaUI.setButtonLoading(btn, true, 'Recalculando FIX...');
    try {
      await new Promise(r => setTimeout(r, 200));
      await window.apiFacade.updateMetalRates({
        fix_oro_hoy_usd: parseFloat(f.fix_hoy.value),
        fix_oro_ayer_usd: parseFloat(f.fix_ayer.value),
        tipo_cambio_usd_mxn: parseFloat(f.tc.value)
      });
      window.MartelaUI.closeModal();
      window.MartelaUI.toast('Tasas Fix actualizadas aplicando regla de mayor valor', 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.setButtonLoading(btn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function openModalMaquila() {
    const html = `
      <form onsubmit="MartelaPricing.saveMaquilaModal(event)" class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-slate-500 block mb-1">Tipo de Movimiento</label>
          <select name="tipo_movimiento">
            <option value="DEPOSITO_ORO_FINO">Depósito Físico de Oro Fino 24K (Abono a favor)</option>
            <option value="DEBITO_LIQUIDACION">Cargo / Liquidación de Entrega B2B (Débito)</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Gramos de Oro Fino 24K (5 dec)</label>
            <input name="gramos_oro_fino" type="number" step="0.00001" min="0.01" value="25.00000" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Folio Acta / Referencia</label>
            <input name="folio_acta" value="ACTA-AU-2026-509" required class="font-mono" />
          </div>
        </div>
        <div class="flex justify-end gap-2">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">Guardar Movimiento</button>
        </div>
      </form>
    `;
    window.MartelaUI.openModal('Movimiento en Cuenta Corriente de Oro Fino (Montepío)', html, 'max-w-lg');
  }

  async function saveMaquilaModal(e) {
    e.preventDefault();
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    window.MartelaUI.setButtonLoading(btn, true, 'Registrando Movimiento...');
    try {
      await new Promise(r => setTimeout(r, 200));
      await window.apiFacade.registerMaquilaGoldMovement({
        tipo_movimiento: f.tipo_movimiento.value,
        gramos_oro_fino: parseFloat(f.gramos_oro_fino.value),
        folio_acta: f.folio_acta.value.trim()
      });
      window.MartelaUI.closeModal();
      window.MartelaUI.toast('Saldo de Oro Fino Puro actualizado', 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.setButtonLoading(btn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function goToCompPage(page) {
    compPage = page;
    await window.MartelaUI.flashLoading('Cargando bitácora de Oro Fino...', 180);
    render(document.getElementById('contentContainer'));
  }

  async function setCompPageSize(size) {
    compPageSize = size;
    compPage = 1;
    await window.MartelaUI.flashLoading('Ajustando a ' + size + ' movimientos por página...', 220);
    render(document.getElementById('contentContainer'));
  }

  return {
    render,
    onSelectPhysicalPiece,
    onCalculateBipartite,
    debitSimulatedPieceFromMaquila,
    openModalEditarRates,
    saveRates,
    openModalMaquila,
    saveMaquilaModal,
    goToCompPage,
    setCompPageSize
  };
})();
