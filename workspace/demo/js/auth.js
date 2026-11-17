/**
 * MARTELA — Control de Acceso, Autenticación y Roles Operativos (6 Módulos Core SDOP)
 * Basado en los actores reales del análisis operativo de MARTELA:
 * - Carlos Mendoza (Dirección / Administrador General): Acceso a los 6 módulos
 * - David Morales (Recepción de Valijas, Video-Evidencia y Mesa de Calidad): Módulos 2, 1, 3, 5
 * - Elisa Ramírez (Báscula Digital, Sub-piezas, Gavetas y Despiece B2B): Módulos 3, 1, 5
 * - Adriana López (Motor Financiero Fix, Liquidación Bipartita y Auditoría PLD): Módulos 4, 5, 6, 1
 * - Miguel Torres (Chofer Custodio PWA Móvil y Sellos PLD): Módulo 6
 */
window.MartelaAuth = (function() {
  const USERS = {
    admin: {
      key: 'admin',
      name: 'Carlos Mendoza',
      role: 'Dirección / Administrador General',
      email: 'carlos.mendoza@martela.mx',
      modules: ['catalog', 'reception', 'inventory', 'pricing', 'coppel', 'logistics']
    },
    recepcion: {
      key: 'recepcion',
      name: 'David Morales',
      role: 'Recepción, Video-Evidencia y Calidad',
      email: 'david.morales@martela.mx',
      modules: ['reception', 'catalog', 'inventory', 'coppel']
    },
    boveda: {
      key: 'boveda',
      name: 'Elisa Ramírez',
      role: 'Báscula Digital, Gavetas y Despiece B2B',
      email: 'elisa.ramirez@martela.mx',
      modules: ['inventory', 'catalog', 'coppel']
    },
    finanzas: {
      key: 'finanzas',
      name: 'Adriana López',
      role: 'Motor Financiero Fix y Auditoría PLD',
      email: 'adriana.lopez@martela.mx',
      modules: ['pricing', 'coppel', 'logistics', 'catalog']
    },
    chofer: {
      key: 'chofer',
      name: 'Miguel Torres',
      role: 'Chofer Custodio PWA Móvil',
      email: 'miguel.torres@martela.mx',
      modules: ['logistics']
    }
  };

  const STORAGE_KEY = 'martela_current_user_key';

  function getCurrentUser() {
    const key = localStorage.getItem(STORAGE_KEY) || 'admin';
    return USERS[key] || USERS.admin;
  }

  function login(username, password) {
    if (password !== 'martela123') {
      return { success: false, message: 'Contraseña de demostración incorrecta (Use: martela123)' };
    }
    const user = USERS[username];
    if (!user) {
      return { success: false, message: 'Usuario no reconocido en el catálogo de roles.' };
    }
    localStorage.setItem(STORAGE_KEY, user.key);
    return { success: true, user };
  }

  function switchRole(roleKey) {
    if (USERS[roleKey]) {
      localStorage.setItem(STORAGE_KEY, roleKey);
      return USERS[roleKey];
    }
    return getCurrentUser();
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function hasAccess(moduleKey) {
    const u = getCurrentUser();
    return u.modules.includes(moduleKey);
  }

  return {
    USERS,
    getCurrentUser,
    login,
    switchRole,
    logout,
    hasAccess
  };
})();
