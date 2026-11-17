/**
 * MARTELA — Controlador Principal de la Aplicación (App Router & State Controller)
 * Contiene exclusivamente los 6 Módulos de Alto Impacto depurados bajo metodología SDOP.
 */
window.MartelaApp = (function() {
  const MODULE_MAP = {
    catalog: {
      name: '1. Catálogo & Circonias',
      shortName: 'Catálogo',
      desc: 'Fichas técnicas y matriz CZ',
      iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3h12l4 6-10 12L2 9l4-6z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2 9h20M12 21L8 9l-2-6M12 21l4-12 2-6M8 9l4-6 4 6" /></svg>`,
      module: window.MartelaCatalog
    },
    reception: {
      name: '2. Recepción & Calidad',
      shortName: 'Recepción',
      desc: 'Valijas aduanales y video',
      iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /></svg>`,
      module: window.MartelaReception
    },
    inventory: {
      name: '3. Báscula & Bóveda',
      shortName: 'Báscula',
      desc: 'Pesaje analítico por gaveta',
      iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v18m-8-6l4-8 4 8H4zm12 0l4-8 4 8h-8zM4 21h16" /></svg>`,
      module: window.MartelaInventory
    },
    pricing: {
      name: '4. Cotización FIX & Costos',
      shortName: 'Cotización FIX',
      desc: 'Tarifa máxima y liquidación',
      iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /><path stroke-linecap="round" stroke-linejoin="round" d="M3 21h18" /></svg>`,
      module: window.MartelaPricing
    },
    coppel: {
      name: '5. Despiece B2B (Coppel & MLS)',
      shortName: 'Despiece B2B',
      desc: 'Portal Coppel & Montepío Luz Saviñón',
      iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>`,
      module: window.MartelaCoppel
    },
    logistics: {
      name: '6. Custodia & Entrega PLD',
      shortName: 'Custodia PLD',
      desc: 'Firma digital y geo-evidencia',
      iconSvg: `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>`,
      module: window.MartelaLogistics
    }
  };

  let currentTab = 'catalog';

  function init() {
    applyTheme();
    applySidebarState();
    const user = window.MartelaAuth.getCurrentUser();
    if (localStorage.getItem('martela_logged_in') === 'true') {
      showApp(user);
    } else {
      showLogin();
    }
  }

  function showLogin() {
    document.getElementById('loginView')?.classList.remove('hidden');
    document.getElementById('appView')?.classList.add('hidden');
  }

  function showApp(user) {
    document.getElementById('loginView')?.classList.add('hidden');
    document.getElementById('appView')?.classList.remove('hidden');
    window.scrollTo(0, 0);

    const sideUser = document.getElementById('sideUserName');
    const sideRole = document.getElementById('sideUserRole');
    const sideAvatar = document.getElementById('sideUserAvatar');
    const topUser = document.getElementById('topUserName');
    const topRole = document.getElementById('topUserRole');
    const roleSelect = document.getElementById('topRoleSelector');

    if (sideUser) sideUser.textContent = user.name;
    if (sideRole) sideRole.textContent = user.role;
    if (topUser) topUser.textContent = user.name;
    if (topRole) topRole.textContent = user.role;
    if (roleSelect) roleSelect.value = user.key;

    if (sideAvatar) {
      const initials = (user.name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      sideAvatar.textContent = initials || 'OP';
      sideAvatar.title = `${user.name} — ${user.role}`;
    }

    renderNavigation(user);
    applySidebarState();

    if (!user.modules.includes(currentTab) || !MODULE_MAP[currentTab]) {
      currentTab = user.modules[0] || 'catalog';
    }

    switchTab(currentTab);
  }

  function renderNavigation(user) {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    nav.innerHTML = Object.entries(MODULE_MAP)
      .filter(([key]) => user.modules.includes(key))
      .map(([key, item]) => `
        <button 
          onclick="MartelaApp.switchTab('${key}')"
          id="navbtn-${key}"
          class="navbtn group ${currentTab === key ? 'active' : ''}"
          title="${item.name} — ${item.desc}"
        >
          <span class="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-amber-500 group-[.active]:text-amber-500 bg-slate-100/70 dark:bg-slate-800/80 group-[.active]:bg-amber-500/10 transition-colors flex-shrink-0">
            ${item.iconSvg}
          </span>
          <div class="sidebar-text flex-1 min-w-0 text-left">
            <div class="text-xs font-bold leading-tight text-slate-700 dark:text-slate-200 group-[.active]:text-amber-600 dark:group-[.active]:text-amber-400 truncate">
              ${item.name}
            </div>
            <div class="text-[10px] text-slate-400 dark:text-slate-500 font-normal leading-tight mt-0.5 truncate">
              ${item.desc}
            </div>
          </div>
        </button>
      `).join('');
  }

  async function switchTab(tabId) {
    const user = window.MartelaAuth.getCurrentUser();
    if (!user.modules.includes(tabId) || !MODULE_MAP[tabId]) {
      window.MartelaUI.toast('Su rol actual no cuenta con permisos para este módulo', 'error');
      return;
    }

    currentTab = tabId;

    document.querySelectorAll('.navbtn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`navbtn-${tabId}`);
    if (activeBtn) activeBtn.classList.add('active');

    const mod = MODULE_MAP[tabId];
    const crumb = document.getElementById('pageCrumb');
    const title = document.getElementById('pageTitle');
    if (crumb) crumb.textContent = mod?.name || '';
    if (title) title.textContent = mod?.name || '';

    closeSidebar();

    const container = document.getElementById('contentContainer');
    if (container && mod?.module?.render) {
      await mod.module.render(container);
    }
  }

  function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('loginUserSelect')?.value;
    const password = document.getElementById('loginPasswordInput')?.value;

    const res = window.MartelaAuth.login(username, password);
    if (!res.success) {
      const err = document.getElementById('loginErrorMessage');
      if (err) {
        err.textContent = res.message;
        err.classList.remove('hidden');
      }
      return;
    }

    localStorage.setItem('martela_logged_in', 'true');
    currentTab = res.user.modules[0] || 'catalog';
    window.apiFacade.audit('INICIO_SESION', 'Seguridad', res.user.key, `Acceso con rol ${res.user.role}`);
    showApp(res.user);
  }

  function handleRoleSwitch(roleKey) {
    const user = window.MartelaAuth.switchRole(roleKey);
    currentTab = user.modules[0] || 'catalog';
    window.MartelaUI.toast(`Cambiado al perfil: ${user.name} (${user.role})`, 'info');
    window.apiFacade.audit('CAMBIO_ROL_SIMULADO', 'Seguridad', user.key, user.role);
    showApp(user);
  }

  function handleLogout() {
    window.MartelaAuth.logout();
    localStorage.removeItem('martela_logged_in');
    showLogin();
  }

  function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', !isDark);
    localStorage.setItem('martela_theme', !isDark ? 'dark' : 'light');
    updateThemeButtons(!isDark);
  }

  function applyTheme() {
    const saved = localStorage.getItem('martela_theme') || 'dark';
    const isDark = saved === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    updateThemeButtons(isDark);
  }

  function updateThemeButtons(isDark) {
    const label = isDark ? 'Modo Claro' : 'Modo Oscuro';
    const icon = isDark ? '☀' : '☾';

    const loginBtn = document.getElementById('loginThemeBtn');
    if (loginBtn) loginBtn.innerHTML = `<span>${icon}</span> <span>${label}</span>`;

    const topBtn = document.getElementById('topThemeBtn');
    if (topBtn) topBtn.innerHTML = `<span>${icon}</span> <span class="hidden sm:inline">${label}</span>`;
  }

  function openSidebar() {
    document.getElementById('appSidebar')?.classList.add('open');
    document.getElementById('sidebarOverlay')?.classList.remove('hidden');
  }

  function closeSidebar() {
    document.getElementById('appSidebar')?.classList.remove('open');
    document.getElementById('sidebarOverlay')?.classList.add('hidden');
  }

  function toggleSidebarCollapse() {
    const sidebar = document.getElementById('appSidebar');
    const appView = document.getElementById('appView');
    if (!sidebar || !appView) return;

    const isCollapsed = sidebar.classList.toggle('collapsed');
    appView.classList.toggle('sidebar-collapsed', isCollapsed);
    localStorage.setItem('martela_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    updateCollapseButtons(isCollapsed);
  }

  function applySidebarState() {
    const saved = localStorage.getItem('martela_sidebar_collapsed') === 'true';
    const sidebar = document.getElementById('appSidebar');
    const appView = document.getElementById('appView');
    if (sidebar && appView) {
      sidebar.classList.toggle('collapsed', saved);
      appView.classList.toggle('sidebar-collapsed', saved);
      updateCollapseButtons(saved);
    }
  }

  function updateCollapseButtons(isCollapsed) {
    const topLabel = document.getElementById('topbarCollapseLabel');
    const topBtn = document.getElementById('topbarCollapseBtn');
    const sideBtn = document.getElementById('sidebarCollapseBtn');
    const bottomArrow = document.getElementById('sidebarBottomArrow');
    const bottomBtn = document.getElementById('sidebarBottomCollapseBtn');

    if (topLabel) {
      topLabel.textContent = isCollapsed ? 'Mostrar Menú ▶' : 'Pantalla Completa ◀';
    }
    if (topBtn) {
      topBtn.title = isCollapsed ? 'Mostrar menú lateral' : 'Contraer menú (Pantalla Completa)';
      topBtn.classList.toggle('bg-amber-500/10', isCollapsed);
      topBtn.classList.toggle('border-amber-500/40', isCollapsed);
      topBtn.classList.toggle('text-amber-600', isCollapsed);
    }
    if (sideBtn) {
      sideBtn.title = isCollapsed ? 'Expandir menú lateral' : 'Contraer menú (Pantalla Completa)';
      sideBtn.innerHTML = isCollapsed
        ? `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>`
        : `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>`;
    }
    if (bottomArrow) {
      bottomArrow.textContent = isCollapsed ? '▶' : '◀';
    }
    if (bottomBtn) {
      bottomBtn.title = isCollapsed ? 'Expandir menú lateral' : 'Contraer menú (Pantalla Completa)';
    }
  }

  async function exportBackup() {
    const json = await window.apiFacade.exportBackupJSON();
    const filename = `martela-db-respaldo-${new Date().toISOString().slice(0, 10)}.json`;
    window.MartelaUI.downloadBlob(json, filename, 'application/json');
    window.MartelaUI.toast('Respaldo JSON preparado y descargado', 'success');
  }

  async function resetDemo() {
    if (!confirm('¿Restablecer toda la base de datos a los valores iniciales de demostración?')) {
      return;
    }
    await window.apiFacade.resetDemo();
    window.MartelaUI.toast('Base de datos restablecida a valores iniciales', 'info');
    init();
  }

  return {
    init,
    showLogin,
    showApp,
    switchTab,
    handleLogin,
    handleRoleSwitch,
    handleLogout,
    toggleTheme,
    openSidebar,
    closeSidebar,
    toggleSidebarCollapse,
    applySidebarState,
    exportBackup,
    resetDemo
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  window.MartelaApp.init();
});
