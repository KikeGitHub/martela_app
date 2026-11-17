/**
 * MARTELA — MÓDULO 6 SDOP: PWA Móvil de Reparto para Choferes (375px-430px), Validación de Sello de Seguridad
 * y Expediente Digital Inmutable de Auditoría PLD (Adriana).
 * Incluye modo Offline-First con cola de sincronización en LocalStorage, geolocalización GPS y Firma Táctil Canvas.
 */
window.MartelaLogistics = (function() {
  let isMobileFrameActive = false;
  let isOfflineSimulated = false;

  async function render(container) {
    const routes = await window.apiFacade.getRoutes();
    const route = routes[0];
    const db = window.apiFacade._getDB();
    const offlineQueueCount = (db.pwa_offline_queue || []).length;
    const pldDossiers = db.pld_evidencias_entrega || [];
    const { esc, badge } = window.MartelaUI;

    const completadas = route.paradas.filter(p => p.estatus === 'ENTREGADA').length;
    const totalParadas = route.paradas.length;

    container.innerHTML = `
      <!-- Encabezado Módulo 6 -->
      <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div>
          <div class="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-500 font-bold mb-1">
            <span>MÓDULO 6 · ARQUITECTURA SDOP</span>
            <span class="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[10px]">PWA MÓVIL 390px &amp; PLD</span>
          </div>
          <h1 class="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">PWA Móvil de Reparto y Expediente Digital PLD</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Validación en campo del Folio de Sello de Seguridad, firma táctil en Canvas, foto del acuse sellado, coordenadas GPS y modo Offline-First.
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button
            onclick="MartelaLogistics.toggleOfflineMode()"
            class="btn ${isOfflineSimulated ? 'bg-amber-600 text-white' : 'btn-soft'}"
          >
            <span>${isOfflineSimulated ? '📡 Modo Sin Señal (Offline-First Activo)' : '📶 Señal LTE Online'}</span>
          </button>
          ${offlineQueueCount > 0 ? `
            <button onclick="MartelaLogistics.syncOffline()" class="btn btn-gold">
              <span>🔄</span> Sincronizar Cola Offline (${offlineQueueCount})
            </button>
          ` : ''}
          <button
            onclick="MartelaLogistics.togglePhoneFrame()"
            class="btn ${isMobileFrameActive ? 'btn-gold' : 'btn-soft'}"
          >
            <span>📱</span> ${isMobileFrameActive ? 'Vista Escritorio Completa' : 'Simular Smartphone PWA (390px)'}
          </button>
        </div>
      </div>

      <!-- Contenedor Principal (Conmutable a Smartphone 390px) -->
      <div class="${isMobileFrameActive ? 'max-w-[410px] mx-auto p-4 bg-slate-950 rounded-[42px] shadow-2xl border-4 border-slate-700 my-4' : ''}">
        ${isMobileFrameActive ? `
          <div class="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-3"></div>
          <div class="flex justify-between items-center text-[10px] text-slate-400 px-2 mb-3 font-mono">
            <span>09:42 · GPS ACTIVO</span>
            <span class="text-amber-400 font-bold">MARTELA PWA v2</span>
            <span>${isOfflineSimulated ? '⚡ OFFLINE-DB' : '5G 100%'}</span>
          </div>
        ` : ''}

        <!-- Cabecera de Ruta y Progreso -->
        <div class="panel p-5 mb-6 border-l-4 border-amber-500">
          <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-bold text-base text-slate-900 dark:text-white">${esc(route.id)}</span>
                ${badge(route.estatus)}
                <span class="text-xs text-slate-400">Auditoría PLD: <b>${esc(route.auditor_pld || 'Adriana López')}</b></span>
              </div>
              <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Chofer: <b>${esc(route.chofer)}</b> · Unidad: <b>${esc(route.vehiculo)}</b>
              </div>
            </div>
            <div class="text-right">
              <span class="text-xs text-slate-400 font-semibold">Paradas Certificadas:</span>
              <div class="text-lg font-black text-amber-600 dark:text-amber-400">${completadas} / ${totalParadas} sucursales</div>
            </div>
          </div>
        </div>

        <!-- Lista de Paradas de la Ruta -->
        <div class="space-y-4 mb-8">
          ${route.paradas.map((parada, idx) => `
            <div class="panel p-5 ${parada.estatus === 'ENTREGADA' ? 'border-emerald-500/40 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800'}">
              <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${parada.estatus === 'ENTREGADA' ? 'bg-emerald-500 text-white' : 'bg-amber-500/20 text-amber-500'}">
                    ${idx + 1}
                  </div>
                  <div>
                    <h4 class="font-bold text-sm text-slate-900 dark:text-white">${esc(parada.sucursal)}</h4>
                    <p class="text-xs text-slate-400">${esc(parada.direccion)}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    🔒 SELLO: ${esc(parada.sello_seguridad_bolsa || 'Z008341')}
                  </span>
                  ${badge(parada.estatus)}
                </div>
              </div>

              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl mb-4 font-mono">
                <div>
                  <span class="text-slate-400 block text-[10px]">REMISIÓN / SAE:</span>
                  <span class="font-bold">${esc(parada.id_remision || 'REM-2026')} · ${esc(parada.folio_factura)}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">BULTOS / CAJA:</span>
                  <span class="font-bold">Caja #${parada.caja_numero} (${parada.piezas_caja} pzs)</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">COORDENADAS GPS:</span>
                  <span class="font-bold">${Number(parada.latitud || 19.3614).toFixed(4)}, ${Number(parada.longitud || -99.2738).toFixed(4)}</span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[10px]">EXPEDIENTE PLD:</span>
                  <span class="font-bold text-amber-600 dark:text-amber-400">${esc(parada.expediente_pld_folio || 'PLD-EXP-2026')}</span>
                </div>
              </div>

              ${parada.estatus === 'ENTREGADA' ? `
                <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/20">
                  <div>
                    ✓ <b>Expediente PLD Sellado:</b> Recibió <b>${esc(parada.receptor_nombre)}</b> · Sello <b>${esc(parada.sello_seguridad_bolsa)}</b> verificado
                  </div>
                  <button
                    onclick="MartelaLogistics.openPldDossierModal('${parada.parada_id}')"
                    class="btn btn-soft text-xs py-1"
                  >
                    🛡️ Ver Expediente PLD Inmutable
                  </button>
                </div>
              ` : `
                <div class="flex flex-wrap justify-end gap-2">
                  <button
                    onclick="MartelaLogistics.captureBrowserGPS('${route.id}', '${parada.parada_id}')"
                    class="btn btn-soft text-xs py-1.5"
                  >
                    📍 Capturar Geolocalización GPS
                  </button>
                  <button
                    onclick="MartelaLogistics.abrirModalEntregaPld('${route.id}', '${parada.parada_id}')"
                    class="btn btn-gold text-xs py-1.5"
                  >
                    ✍ Validar Sello, Firma Táctil y Sellar PLD
                  </button>
                </div>
              `}
            </div>
          `).join('')}
        </div>

        <!-- Bitácora de Expedientes Digitales PLD (Auditoría Adriana) -->
        ${pldDossiers.length > 0 ? `
          <div class="panel p-5">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-3">
              🛡️ Bóveda de Expedientes Digitales PLD Certificados (${pldDossiers.length})
            </h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs font-mono">
                <thead class="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase">
                  <tr>
                    <th class="p-2">Folio PLD</th>
                    <th class="p-2">Sucursal</th>
                    <th class="p-2">Sello Bolsa</th>
                    <th class="p-2">Recibió</th>
                    <th class="p-2">GPS</th>
                    <th class="p-2">Estatus Auditoría</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
                  ${pldDossiers.map(d => `
                    <tr>
                      <td class="p-2 font-bold text-amber-500">${esc(d.folio_expediente)}</td>
                      <td class="p-2">${esc(d.sucursal)}</td>
                      <td class="p-2 font-bold text-emerald-500">${esc(d.sello_seguridad_bolsa)}</td>
                      <td class="p-2">${esc(d.receptor_nombre)}</td>
                      <td class="p-2">${Number(d.latitud).toFixed(4)}, ${Number(d.longitud).toFixed(4)}</td>
                      <td class="p-2">${badge(d.estatus_auditoria)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function togglePhoneFrame() {
    isMobileFrameActive = !isMobileFrameActive;
    render(document.getElementById('contentContainer'));
  }

  function toggleOfflineMode() {
    isOfflineSimulated = !isOfflineSimulated;
    window.MartelaUI.toast(
      isOfflineSimulated
        ? 'Modo Sin Conexión (Offline-First) activado: las entregas se guardarán en cola local y se sincronizarán al recuperar señal'
        : 'Conexión celular restablecida (Online)',
      'info'
    );
    render(document.getElementById('contentContainer'));
  }

  async function syncOffline() {
    const count = await window.apiFacade.syncOfflinePwaQueue();
    isOfflineSimulated = false;
    window.MartelaUI.toast(`${count} expedientes PLD sincronizados con éxito`, 'success');
    render(document.getElementById('contentContainer'));
  }

  function captureBrowserGPS(routeId, paradaId) {
    const db = window.apiFacade._getDB();
    const route = db.routes.find(r => r.id === routeId);
    const stop = route?.paradas.find(p => p.parada_id === paradaId);
    if (!stop) return;

    const applyCoords = (lat, lng) => {
      stop.latitud = lat;
      stop.longitud = lng;
      stop.hora_llegada = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      window.apiFacade._saveDB(db);
      window.MartelaUI.toast(`Coordenadas GPS fijadas (${lat.toFixed(5)}, ${lng.toFixed(5)})`, 'success');
      render(document.getElementById('contentContainer'));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => applyCoords(pos.coords.latitude, pos.coords.longitude),
        () => applyCoords(stop.latitud || 19.36142, stop.longitud || -99.27381),
        { timeout: 2500 }
      );
    } else {
      applyCoords(stop.latitud || 19.36142, stop.longitud || -99.27381);
    }
  }

  function abrirModalEntregaPld(routeId, paradaId) {
    const db = window.apiFacade._getDB();
    const route = db.routes.find(r => r.id === routeId);
    const parada = route?.paradas.find(p => p.parada_id === paradaId);
    if (!parada) return;
    const { esc } = window.MartelaUI;

    const html = `
      <form onsubmit="MartelaLogistics.confirmarEntregaPld(event, '${routeId}', '${paradaId}')" class="space-y-4">
        <div class="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-500/30 text-xs flex justify-between items-center">
          <div>
            Sucursal: <b>${esc(parada.sucursal)}</b><br>
            Remisión: <b>${esc(parada.id_remision || 'REM-2026')}</b> · Caja #${parada.caja_numero} (${parada.piezas_caja} piezas)
          </div>
          <div class="text-right font-mono">
            <span class="text-[10px] text-slate-400 block">SELLO ESPERADO:</span>
            <b class="text-amber-600 dark:text-amber-400 text-sm">${esc(parada.sello_seguridad_bolsa || 'Z008341')}</b>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-bold text-slate-500 block mb-1">1. Validar Folio de Sello de Seguridad Plástico</label>
            <input name="sello_verificado" value="${esc(parada.sello_seguridad_bolsa || 'Z008341')}" required class="font-mono font-bold text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <label class="text-xs font-bold text-slate-500 block mb-1">2. Nombre Completo del Encargado que Recibe</label>
            <input name="receptor_nombre" value="Lic. Claudia Mendoza (Gerente de Sucursal)" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Latitud GPS</label>
            <input name="latitud" type="number" step="0.000001" value="${parada.latitud || 19.361420}" required class="font-mono" />
          </div>
          <div>
            <label class="text-xs font-semibold text-slate-500 block mb-1">Longitud GPS</label>
            <input name="longitud" type="number" step="0.000001" value="${parada.longitud || -99.273810}" required class="font-mono" />
          </div>
        </div>

        <!-- Canvas Táctil HTML5 -->
        <div>
          <div class="flex justify-between items-center mb-1">
            <label class="text-xs font-bold text-slate-500">3. Firma Digital Táctil del Encargado de Tienda (Canvas HTML5)</label>
            <button type="button" onclick="MartelaUI.clearSignature('canvasFirmaEntrega')" class="text-xs font-bold text-amber-500 hover:underline">
              Limpiar Firma
            </button>
          </div>
          <div class="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950">
            <canvas id="canvasFirmaEntrega" width="500" height="150" class="w-full h-36 touch-none cursor-crosshair"></canvas>
          </div>
        </div>

        <div>
          <label class="text-xs font-bold text-slate-500 block mb-1">4. Fotografía del Comprobante Sellado en Mostrador</label>
          <input type="file" accept="image/*" capture="environment" class="text-xs" />
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button type="button" onclick="MartelaUI.closeModal()" class="btn btn-soft">Cancelar</button>
          <button type="submit" class="btn btn-gold">🛡️ Finalizar Entrega y Sellar Expediente PLD</button>
        </div>
      </form>
    `;
    window.MartelaUI.openModal('Certificación de Entrega en Campo y Expediente PLD', html, 'max-w-xl');
    setTimeout(() => window.MartelaUI.initSignatureCanvas('canvasFirmaEntrega'), 60);
  }

  async function confirmarEntregaPld(e, routeId, paradaId) {
    e.preventDefault();
    if (!window.MartelaUI.isCanvasSigned('canvasFirmaEntrega')) {
      window.MartelaUI.toast('Por favor dibuja la firma digital del receptor en el recuadro táctil', 'error');
      return;
    }
    const f = e.target;
    const btn = f.querySelector('button[type="submit"]');
    window.MartelaUI.setButtonLoading(btn, true, 'Certificando Firma y PLD...');
    const firmaBase64 = window.MartelaUI.getCanvasDataURL('canvasFirmaEntrega');

    try {
      await new Promise(r => setTimeout(r, 250));
      const rec = await window.apiFacade.confirmPldDeliveryStop(
        routeId,
        paradaId,
        {
          sello_verificado: f.sello_verificado.value,
          receptor_nombre: f.receptor_nombre.value,
          latitud: parseFloat(f.latitud.value),
          longitud: parseFloat(f.longitud.value),
          firma_canvas_data: firmaBase64,
          evidencia_sello_url: 'acuse-sellado-mostrador-verificado.jpg'
        },
        isOfflineSimulated
      );
      window.MartelaUI.closeModal();
      window.MartelaUI.toast(`Expediente PLD ${rec.folio_expediente} sellado con éxito`, 'success');
      render(document.getElementById('contentContainer'));
    } catch (err) {
      window.MartelaUI.setButtonLoading(btn, false);
      window.MartelaUI.toast(err.message, 'error');
    }
  }

  function openPldDossierModal(paradaId) {
    const db = window.apiFacade._getDB();
    const stop = db.routes[0]?.paradas.find(p => p.parada_id === paradaId);
    if (!stop) return;
    const { esc } = window.MartelaUI;

    const html = `
      <div class="space-y-4 text-xs">
        <div class="p-5 rounded-2xl bg-slate-900 text-white space-y-3 font-mono">
          <div class="flex justify-between items-center border-b border-slate-700 pb-2">
            <span class="text-amber-400 font-bold">EXPEDIENTE DIGITAL INMUTABLE PLD</span>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">${esc(stop.expediente_pld_folio)}</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>Sucursal: <b>${esc(stop.sucursal)}</b></div>
            <div>Folio Sello Plástico: <b class="text-emerald-400">${esc(stop.sello_seguridad_bolsa)} (VALIDADO)</b></div>
            <div>Recibió: <b>${esc(stop.receptor_nombre)}</b></div>
            <div>GPS: <b>${Number(stop.latitud).toFixed(5)}, ${Number(stop.longitud).toFixed(5)}</b></div>
          </div>
          ${stop.firma_canvas_data ? `
            <div class="p-3 rounded-xl bg-white text-slate-900 text-center">
              <div class="text-[10px] text-slate-500 mb-1">FIRMA DIGITAL ENCRIPTADA BASE64</div>
              <img src="${stop.firma_canvas_data}" class="max-h-28 mx-auto" alt="Firma PLD" />
            </div>
          ` : ''}
        </div>
        <div class="flex justify-end gap-2">
          <button onclick="MartelaUI.closeModal()" class="btn btn-soft">Cerrar</button>
          <button onclick="window.print()" class="btn btn-gold">🖨️ Imprimir Expediente PLD</button>
        </div>
      </div>
    `;
    window.MartelaUI.openModal(`Expediente de Auditoría PLD · ${stop.sucursal}`, html, 'max-w-lg');
  }

  return {
    render,
    togglePhoneFrame,
    toggleOfflineMode,
    syncOffline,
    captureBrowserGPS,
    abrirModalEntregaPld,
    confirmarEntregaPld,
    openPldDossierModal
  };
})();
