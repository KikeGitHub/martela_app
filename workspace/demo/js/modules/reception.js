/**
 * MARTELA — MÓDULO 2 SDOP: Recepción de Paquetería, Video-Evidencia y Mesa de Control de Calidad
 * Wizard de 2 pasos:
 * Paso 1: Registro de Guía (FedEx/Cometra), Bultos, Pesaje Bruto de Valija y Video-Evidencia de desempaque.
 * Paso 2: Grilla interactiva de inspección con Semáforo de Calidad (+1 Aprobado verde, +1 Reparación amarillo, +1 Merma rojo).
 */
window.MartelaReception = (function() {
  let activeReceptionId = 101;
  let wizardStep = 2; // Mostramos ambos pasos con conmutación rápida

  async function render(container) {
    const receptions = await window.apiFacade.getReceptions();
    const suppliers = await window.apiFacade.getSuppliers();
    const activeRec = receptions.find(r => r.id_recepcion === Number(activeReceptionId)) || receptions[0];
    if (activeRec) activeReceptionId = activeRec.id_recepcion;

    const { esc, badge, grams } = window.MartelaUI;

    // Totales del semáforo de la recepción activa
    const rows = activeRec?.inspecciones || [];
    const totalRecibidas = rows.reduce((s, r) => s + r.piezas_recibidas, 0);
    const totalAprobadas = rows.reduce((s, r) => s + r.piezas_aprobadas, 0);
    const totalReparacion = rows.reduce((s, r) => s + r.piezas_reparacion_interna, 0);
    const totalMerma = rows.reduce((s, r) => s + r.piezas_merma_fundicion, 0);
    const totalClasificadas = totalAprobadas + totalReparacion + totalMerma;
    const pendientesConteo = Math.max(0, totalRecibidas - totalClasificadas);

    container.innerHTML = `
      <!-- Encabezado Módulo 2 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div class="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">
            <span>MÓDULO 2 · ARQUITECTURA SDOP</span>
            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px]">ADUANAS & CONTROL DE CALIDAD</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">Recepción, Video-Evidencia y Mesa de Calidad</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Trazabilidad de valijas FedEx/Cometra con video continuo de apertura y clasificación en tiempo real hacia Báscula, Taller o Fundición.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button onclick="MartelaReception.setStep(1)" class="btn ${wizardStep === 1 ? 'btn-gold' : 'btn-soft'}">
            <span>📦</span> Paso 1: Registrar Nueva Valija
          </button>
          <button onclick="MartelaReception.setStep(2)" class="btn ${wizardStep === 2 ? 'btn-gold' : 'btn-soft'}">
            <span>🔬</span> Paso 2: Mesa y Semáforo de Calidad
          </button>
        </div>
      </div>

      <!-- Selector de Valijas / Recepciones Recientes -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        ${receptions.map(rec => `
          <div
            onclick="MartelaReception.selectReception(${rec.id_recepcion})"
            class="panel p-4 cursor-pointer transition border-l-4 ${rec.id_recepcion === activeReceptionId ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-300 dark:border-slate-700 opacity-80 hover:opacity-100'}"
          >
            <div class="flex justify-between items-start gap-2">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-black text-sm text-slate-900 dark:text-white">${esc(rec.folio_recepcion)}</span>
                  <span class="font-mono text-xs text-amber-600 dark:text-amber-400 font-bold">${esc(rec.guia_tracking)}</span>
                </div>
                <div class="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1">
                  [${esc(rec.pais_origen)}] ${esc(rec.proveedor_nombre)} · ${esc(rec.paqueteria)}
                </div>
              </div>
              ${badge(rec.estatus)}
            </div>
            <div class="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center text-[11px] text-slate-500">
              <span>📦 <b>${rec.total_bultos} bultos</b> · Peso Bruto Valija: <b>${grams(rec.peso_bruto_paquete_g, 2)}</b></span>
              <button
                type="button"
                onclick="event.stopPropagation(); MartelaReception.openVideoModal('${esc(rec.guia_tracking)}', '${esc(rec.url_video_evidencia)}', '${esc(rec.proveedor_nombre)}')"
                class="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>🎥</span> Ver Video-Evidencia
              </button>
            </div>
          </div>
        `).join('')}
      </div>

      ${wizardStep === 1 ? `
        <!-- ============================================================== -->
        <!-- WIZARD PASO 1: ALTA DE GUÍA, PESAJE DE VALIJA Y VIDEO EVIDENCIA -->
        <!-- ============================================================== -->
        <div class="panel p-6 mb-6 border-t-4 border-amber-500">
          <div class="flex items-center justify-between mb-4">
            <div>
              <span class="text-xs font-bold uppercase text-amber-500">Wizard Paso 1 de 2</span>
              <h3 class="text-lg font-black text-slate-900 dark:text-white">Registro de Valija Consolidada y Video de Desempaque</h3>
            </div>
            <span class="text-xs text-slate-400">Responsable: David Morales (Almacén)</span>
          </div>

          <form onsubmit="MartelaReception.handleCreateReception(event)" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Guía de Tracking (FedEx / Cometra / DHL)</label>
                <input name="guia_tracking" placeholder="Ej. FDX-88492019-CN" value="FDX-88492019-CN" required class="font-mono" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Empresa Transportista / Valores</label>
                <select name="paqueteria">
                  <option value="FedEx International Priority">FedEx International Priority (Aduana)</option>
                  <option value="Cometra Traslado de Valores">Cometra Traslado Blindado</option>
                  <option value="DHL Express Global">DHL Express Global</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Proveedor Origen</label>
                <select name="id_proveedor">
                  ${suppliers.map(s => `<option value="${s.id}">[${esc(s.pais_origen)}] ${esc(s.razon_social)}</option>`).join('')}
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Total de Bultos / Cajas Internas</label>
                <input name="total_bultos" type="number" min="1" value="3" required />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Peso Bruto de Valija Completa (g)</label>
                <input name="peso_bruto_paquete_g" type="number" step="0.01" min="1" value="1945.80" required class="font-mono" />
              </div>
              <div>
                <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">URL / Archivo de Video-Evidencia Continua</label>
                <input name="url_video_evidencia" type="url" value="https://storage.martela.mx/evidencias/2026-10/unboxing-FDX-88492019-cam01.mp4" required />
              </div>
            </div>

            <div>
              <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Observaciones de Sellos Aduanales / Empaque Exterior</label>
              <textarea name="observaciones" rows="2" placeholder="Cinta de seguridad intacta, apertura iniciada bajo cámara cenital #1...">Cinta de seguridad aduanal verificada bajo cámara cenital #1 sin violaciones.</textarea>
            </div>

            <div class="flex justify-end gap-2">
              <button type="button" onclick="MartelaReception.setStep(2)" class="btn btn-soft">Ir a Mesa de Calidad →</button>
              <button type="submit" class="btn btn-gold">💾 Registrar Recepción y Pasar a Inspección (Paso 2)</button>
            </div>
          </form>
        </div>
      ` : ''}

      <!-- ============================================================== -->
      <!-- WIZARD PASO 2: MESA DE CONTROL DE CALIDAD Y SEMÁFORO INTERACTIVO -->
      <!-- ============================================================== -->
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div class="panel p-4 border-l-4 border-slate-500">
          <div class="text-xs font-bold uppercase text-slate-400">Piezas en Valija (${esc(activeRec?.folio_recepcion)})</div>
          <div class="text-2xl font-black text-slate-900 dark:text-white mt-1">${totalRecibidas} pzs</div>
          <div class="text-[11px] text-slate-500">${pendientesConteo} pendientes por clasificar</div>
        </div>

        <div class="panel p-4 border-l-4 border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10">
          <div class="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400">🟢 Aprobadas → Báscula</div>
          <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">${totalAprobadas} pzs</div>
          <div class="text-[11px] text-slate-500">Pasan a Pesaje Individual (Módulo 3)</div>
        </div>

        <div class="panel p-4 border-l-4 border-amber-500 bg-amber-50/30 dark:bg-amber-950/10">
          <div class="text-xs font-bold uppercase text-amber-600 dark:text-amber-400">🟡 Taller Reparación Interna</div>
          <div class="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">${totalReparacion} pzs</div>
          <div class="text-[11px] text-slate-500">Falta circonia o reasa abierta</div>
        </div>

        <div class="panel p-4 border-l-4 border-rose-500 bg-rose-50/30 dark:bg-rose-950/10">
          <div class="text-xs font-bold uppercase text-rose-600 dark:text-rose-400">🔴 Charola Pedacería / Fundición</div>
          <div class="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">${totalMerma} pzs</div>
          <div class="text-[11px] text-slate-500">Daño severo → Crisol de Fundición</div>
        </div>
      </div>

      <div class="panel overflow-hidden">
        <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <h3 class="text-sm font-bold text-slate-900 dark:text-white">
              Mesa de Control de Calidad · Guía ${esc(activeRec?.guia_tracking)} (${esc(activeRec?.proveedor_nombre)})
            </h3>
            <p class="text-xs text-slate-400">Utiliza los botones rápidos del Semáforo de Calidad (+1) para clasificar cada pieza física en tiempo real.</p>
          </div>
          <div class="flex items-center gap-2">
            <button
              onclick="MartelaReception.openVideoModal('${esc(activeRec?.guia_tracking)}', '${esc(activeRec?.url_video_evidencia)}', '${esc(activeRec?.proveedor_nombre)}')"
              class="btn btn-soft text-xs py-1.5"
            >
              🎥 Ver Video Desempaque
            </button>
            <button
              onclick="MartelaReception.finalizeConciliation(${activeRec?.id_recepcion})"
              class="btn btn-gold text-xs py-1.5"
            >
              ✓ Cerrar Acta y Enviar Aprobadas a Báscula
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs">
            <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
              <tr>
                <th class="p-4">SKU 14 Dígitos / Modelo</th>
                <th class="p-4 text-center">Recibidas</th>
                <th class="p-4 text-center">🟢 Aprobadas (Báscula)</th>
                <th class="p-4 text-center">🟡 Taller Reparación</th>
                <th class="p-4 text-center">🔴 Merma Fundición</th>
                <th class="p-4 text-center">Semáforo de Acción Rápida (+1 / -1)</th>
                <th class="p-4">Observaciones Técnicas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              ${rows.map(r => {
                const clasif = r.piezas_aprobadas + r.piezas_reparacion_interna + r.piezas_merma_fundicion;
                const completo = clasif === r.piezas_recibidas;
                return `
                  <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td class="p-4">
                      <div class="font-mono font-bold text-slate-900 dark:text-white">${esc(r.sku_14 || r.sku)}</div>
                      <div class="text-xs font-bold text-amber-600 dark:text-amber-400">${esc(r.modelo_martela || r.sku)}</div>
                      <div class="text-[11px] text-slate-400">${esc(r.descripcion)}</div>
                    </td>
                    <td class="p-4 text-center">
                      <span class="text-sm font-black text-slate-900 dark:text-white">${r.piezas_recibidas}</span>
                      <div class="text-[10px] ${completo ? 'text-emerald-500 font-bold' : 'text-amber-500'}">
                        ${clasif}/${r.piezas_recibidas} revisadas
                      </div>
                    </td>
                    <td class="p-4 text-center">
                      <span class="px-3 py-1 rounded-lg font-mono text-sm font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        ${r.piezas_aprobadas}
                      </span>
                    </td>
                    <td class="p-4 text-center">
                      <span class="px-3 py-1 rounded-lg font-mono text-sm font-black bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
                        ${r.piezas_reparacion_interna}
                      </span>
                    </td>
                    <td class="p-4 text-center">
                      <span class="px-3 py-1 rounded-lg font-mono text-sm font-black bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                        ${r.piezas_merma_fundicion}
                      </span>
                    </td>
                    <td class="p-4">
                      <div class="flex flex-wrap items-center justify-center gap-1.5">
                        <button
                          onclick="MartelaReception.bumpSemaphore(${r.id_inspeccion}, 'APROBADA', 1)"
                          class="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition"
                          title="Enviar a Báscula Digital"
                        >
                          +1 Aprobado
                        </button>
                        <button
                          onclick="MartelaReception.bumpSemaphore(${r.id_inspeccion}, 'REPARACION', 1)"
                          class="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-sm transition"
                          title="Enviar a Taller de Reparación Interna"
                        >
                          +1 Reparación
                        </button>
                        <button
                          onclick="MartelaReception.bumpSemaphore(${r.id_inspeccion}, 'MERMA', 1)"
                          class="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
                          title="Enviar a Charola de Pedacería para Fundición"
                        >
                          +1 Merma
                        </button>
                        <button
                          onclick="MartelaReception.resetRowForDemo(${r.id_inspeccion})"
                          class="px-2 py-1.5 rounded-lg text-[11px] bg-slate-200 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="Reiniciar conteo de esta fila para probar el semáforo"
                        >
                          ↺
                        </button>
                      </div>
                    </td>
                    <td class="p-4 text-slate-500 dark:text-slate-400 max-w-xs">
                      ${esc(r.observaciones_tecnicas)}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function setStep(stepNum) {
    wizardStep = stepNum;
    render(document.getElementById('contentContainer'));
  }

  function selectReception(idRec) {
    activeReceptionId = Number(idRec);
    render(document.getElementById('contentContainer'));
  }

  async function handleCreateReception(e) {
    e.preventDefault();
    const f = e.target;
    const submitBtn = f.querySelector('button[type="submit"]');
    window.MartelaUI.setButtonLoading(submitBtn, true, 'Registrando Valija y Video...');

    try {
      await new Promise(r => setTimeout(r, 280));
      const created = await window.apiFacade.createPackageReception({
        guia_tracking: f.guia_tracking.value.trim(),
        paqueteria: f.paqueteria.value,
        id_proveedor: Number(f.id_proveedor.value),
        total_bultos: Number(f.total_bultos.value),
        peso_bruto_paquete_g: parseFloat(f.peso_bruto_paquete_g.value),
        url_video_evidencia: f.url_video_evidencia.value.trim(),
        observaciones: f.observaciones.value.trim()
      });
      activeReceptionId = created.id_recepcion;
      wizardStep = 2;
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Valija ${created.guia_tracking} registrada. Iniciando Mesa de Calidad.`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.setButtonLoading(submitBtn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  async function openNewReceptionModal() {
    const suppliers = await window.apiFacade.getSuppliers();
    const { esc } = window.MartelaUI;

    const html = `
      <form onsubmit="MartelaReception.handleCreateReception(event)" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Guía de Tracking (FedEx / Cometra / DHL)</label>
            <input name="guia_tracking" placeholder="Ej. FDX-88492019-CN" value="FDX-88492019-CN" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Empresa Transportista / Valores</label>
            <select name="paqueteria">
              <option value="FedEx International Priority">FedEx International Priority (Aduana)</option>
              <option value="Cometra Traslado de Valores">Cometra Traslado Blindado</option>
              <option value="DHL Express Global">DHL Express Global</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Proveedor Origen</label>
            <select name="id_proveedor">
              ${suppliers.map(s => `<option value="${s.id}">[${esc(s.pais_origen)}] ${esc(s.razon_social)}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Total de Bultos / Cajas</label>
            <input name="total_bultos" type="number" min="1" value="3" required />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Peso Bruto Valija Completa (g)</label>
            <input name="peso_bruto_paquete_g" type="number" step="0.01" min="1" value="1945.80" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">URL Video-Evidencia</label>
            <input name="url_video_evidencia" type="url" value="https://storage.martela.mx/evidencias/2026-10/unboxing-FDX-88492019-cam01.mp4" required />
          </div>
        </div>

        <div>
          <label class="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">Observaciones de Sellos / Empaque</label>
          <textarea name="observaciones" rows="2" placeholder="Sellos de seguridad intactos...">Sellos de seguridad intactos verificados bajo cámara cenital #1 sin violaciones.</textarea>
        </div>

        <div class="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">💾 Registrar Valija & Abrir Mesa de Calidad</button>
        </div>
      </form>
    `;
    window.MartelaUI.openModal('Registro de Valija Consolidada y Video-Evidencia', html, 'max-w-2xl');
  }

  async function bumpSemaphore(idInspeccion, bucket, delta) {
    try {
      await window.apiFacade.updateQualitySemaphore(idInspeccion, bucket, delta);
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function resetRowForDemo(idInspeccion) {
    const db = window.apiFacade._getDB();
    const row = (db.inspecciones_calidad || []).find(i => i.id_inspeccion === Number(idInspeccion));
    if (row) {
      row.piezas_aprobadas = Math.max(0, row.piezas_recibidas - 5);
      row.piezas_reparacion_interna = 0;
      row.piezas_merma_fundicion = 0;
      window.apiFacade._saveDB(db);
      window.MartelaUI.toast('Se liberaron 5 piezas en el renglón para probar los botones +1 del Semáforo', 'info');
      render(document.getElementById('contentContainer'));
    }
  }

  async function finalizeConciliation(idRecepcion) {
    try {
      const rec = await window.apiFacade.completeQualityInspection(idRecepcion);
      window.MartelaUI.toast(`Dictamen registrado (${rec.estatus}). Piezas aprobadas listas en Báscula Digital.`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function openVideoModal(guia, url, proveedor) {
    const { esc } = window.MartelaUI;
    const html = `
      <div class="space-y-4">
        <div class="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
          <div>
            <span class="text-emerald-400 font-bold">● REC CÁMARA CENITAL ADUANA #01</span> · Guía: <b class="font-mono">${esc(guia)}</b>
          </div>
          <span class="font-mono text-amber-400">1080p · 60 FPS · SIN CORTES</span>
        </div>

        <div class="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 aspect-video flex flex-col items-center justify-center p-6 text-center">
          <div class="text-4xl mb-2">🎥</div>
          <div class="text-sm font-bold text-white">Evidencia de Desempaque Continuo — ${esc(proveedor)}</div>
          <div class="text-xs text-slate-400 font-mono mt-1 break-all">${esc(url)}</div>
          <div class="mt-4 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono">
            <span>⏱ 00:14:22 / 00:18:40</span>
            <span>·</span>
            <span>Báscula Valija: Verificada</span>
          </div>
        </div>

        <div class="flex justify-end">
          <button onclick="MartelaUI.closeModal()" class="btn btn-gold">Cerrar Visor de Evidencia</button>
        </div>
      </div>
    `;
    window.MartelaUI.openModal(`Video-Evidencia de Recepción · ${guia}`, html, 'max-w-2xl');
  }

  return {
    render,
    setStep,
    selectReception,
    handleCreateReception,
    openNewReceptionModal,
    bumpSemaphore,
    resetRowForDemo,
    finalizeConciliation,
    openVideoModal
  };
})();

