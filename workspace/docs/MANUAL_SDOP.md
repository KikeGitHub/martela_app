💎 Manual de Operación SDOP: Proyecto Martela (Joyería y Oro)
Este documento define la metodología de desarrollo y arquitectura para Martela, plataforma web fullstack para la administración de inventario de joyería fina, metales preciosos (oro por gramaje y quilataje) y control de piezas exclusivas.
El proyecto opera bajo el framework SDOP (Spec-Driven Oracle-Bridge Framework), garantizando que el diseño y la experiencia de usuario aprobados en la demo se mantengan al 100%, con cero duplicación de código en backend y validación humana obligatoria en cada fase.
🏛️ 1. Pilares Inmutables de Arquitectura en Martela
Modelado Especializado de Joyería y Oro:
Las joyas se clasifican en piezas terminadas (anillos, pulseras, aretes con gemas) y oro a granel/materia prima (lingotes, pedacería, granalla).
Todo cálculo de inventario de oro debe manejar con precisión decimal estricta: peso bruto (g), quilataje (24k, 18k, 14k, 10k), peso fino puro (g) y precio dinámico spot del oro.
Patrón Bridge y Adaptadores Duales (Frontend):
Los componentes de interfaz jamás realizan peticiones HTTP directas ni manipulan la base de datos directamente. Dependen exclusivamente de interfaces TypeScript (Repository).
Mediante Feature Flags (environment.ts), el sistema conmuta dinámicamente entre un LocalStorageAdapter (para prototipado y validación de negocio) y un HttpAdapter (para producción).
Arquitectura Hexagonal y Puertos de Salida (Backend):
Los servicios de dominio de inventario no se acoplan a la base de datos; utilizan puertos de salida (RepositoryPort) implementados mediante adaptadores de persistencia (SQLAlchemy / JPA / Prisma).
Auditoría Previa Obligatoria (Audit-First):
Queda estrictamente prohibido crear tablas o controladores duplicados. Si un catálogo o tabla (ej. metales, usuarios, sucursales) ya existe, se adapta y extiende.
Análisis de GAPs en Modo Estricto Solo Lectura (READ-ONLY):
Ningún análisis de brechas realizado por la IA puede modificar o borrar código de producción.
El Oráculo Playwright:
Playwright valida automáticamente flujos de negocio y ejecuta pruebas de regresión visual (toHaveScreenshot) para certificar que la aplicación conectada a la base de datos luzca y se comporte exactamente igual que la demo aprobada.
Gobernanza Human-in-the-Loop:
Existen dos puntos de control donde el desarrollo se detiene para la firma obligatoria del Arquitecto humano: el SDD y el Reporte E2E de Playwright.
📂 2. Estructura de Workspace y Carpetas
martela-workspace/
├── .mcp/
│   └── mcp.json                         # Servidores MCP (Playwright + Postgres)
├── .agents/
│   └── skills/                          # Skills SDOP de Antigravity IDE
│       ├── demo-gap-analysis/SKILL.md   # Skill de diagnóstico READ-ONLY
│       └── demo-gap-implementation/SKILL.md # Skill de integración
├── demo/                                # Prototipo visual aprobado (HTML/CSS)
├── frontend/                            # Frontend desacoplado (Angular o React)
│   └── src/app/modules/
│       ├── control-oro/                 # Módulo de gramaje, quilataje y fundición
│       ├── inventario-joyas/            # Módulo de piezas terminadas y gemas
│       └── [modulo]/
│           ├── [modulo].component.html  (o .template.tsx)
│           ├── [modulo].component.scss  (o .css)
│           ├── [modulo].component.ts    (o .tsx)
│           ├── ports/
│           │   └── [modulo].repository.ts           # Interfaz TypeScript
│           └── adapters/
│               ├── [modulo]-localstorage.adapter.ts # DEMO (LocalStorage)
│               └── [modulo]-http.adapter.ts        # PRODUCCIÓN (API REST)
├── backend/                             # Backend (FastAPI o Spring Boot)
│   ├── domain/ports/out/                # Puertos de salida
│   ├── infrastructure/persistence/      # Modelos y migraciones (Alembic / Flyway)
│   └── application/usecase/             # Lógica de cálculo de pureza y stock
└── docs/                                # SSOT de Gobernanza Centralizada
    ├── adr/                             # Architectural Decision Records
    ├── sdd/                             # Software Design Documents aprobados
    └── gap-analysis/                    # Reportes de GAPs y Pruebas E2E
⚙️ 3. Configuración Inicial: Servidores MCP
Crea el archivo .mcp/mcp.json en la raíz del proyecto para conectar Antigravity IDE con el navegador y la base de datos local:
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-playwright"
      ],
      "env": {
        "PLAYWRIGHT_HEADLESS": "true"
      }
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres:postgres@localhost:5432/martela_db"
      ],
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5432/martela_db"
      }
    }
  }
}
🔄 4. Ciclo de Desarrollo en 5 Fases (Con Prompts para el IDE)
[ FASE 0: Prototipo Interactivo ] ──► (Validación de Joyería y Oro en LocalStorage)
              │
              ▼ (Aprobación del Usuario Funcional)
[ FASE 1: Análisis de GAPs READ-ONLY ] ──► (Auditoría de Reutilización en Backend)
              │
              ▼
[ FASE 2: Creación del Plano SDD ] ──► 🛑 CONTROL HUMANO #1 (Aprobación del Arquitecto)
              │
              ▼
[ FASE 3: Integración Fullstack ] ──► (Migración SQL + Backend + HttpAdapter)
              │
              ▼
[ FASE 4: Oráculo Playwright ] ──► 🛑 CONTROL HUMANO #2 (Firma de Lanzamiento / Merge)
FASE 0: Prototipado y Demo Simulada
Objetivo: Diseñar la pantalla en el Frontend desacoplado con datos simulados en LocalStorage. El usuario puede registrar piezas, pesar oro, simular ventas o traspasos sin tocar la base de datos.
Separación Física Requerida: Dividir en plantilla visual, estilos aislados, lógica de componente, interfaz abstracta y adaptador mock.
📋 Prompt para Antigravity IDE (Fase 0)
Actúa como Senior Frontend Developer en SyborX.

Necesito construir la demo interactiva para el módulo [NOMBRE_MODULO, ej: inventario-joyas / control-oro] en /frontend/src/app/modules/[NOMBRE_MODULO]/.

REGLAS DE DOMINIO (JOYERÍA Y ORO):
- Si es Oro: Incluir campos para tipo de oro (24k, 18k, 14k, 10k), peso bruto en gramos (3 decimales: 0.000g), merma permitida y costo por gramo.
- Si son Joyas: Incluir SKU/Código de barras, tipo de pieza (anillo, cadena, arete), tipo de metal, pedrería/gemas incrustadas y estatus (en vitrina, apartado, en taller).

ESTRUCTURA DE ARCHIVOS SEPARADA:
1. Plantilla visual (`.html` o `.template.tsx`): Maquetación limpia basada en la demo aprobada.
2. Estilos (`.scss` o `.css`): Clases aisladas respetando el diseño gráfico.
3. Componente (`.ts` o `.tsx`): Manejo de estado consumiendo ÚNICAMENTE la interfaz `[Modulo]Repository`.
4. `ports/[modulo].repository.ts`: Interfaz TypeScript con operaciones CRUD y cálculos de inventario.
5. `adapters/[modulo]-localstorage.adapter.ts`: Implementación mock que persiste y lee datos simulados de LocalStorage.

Inyecta `[Modulo]LocalStorageAdapter` mediante la Feature Flag (`environment.features.[modulo]Backend = false`).
Verifica que el módulo compile y sea 100% funcional en el navegador local.
FASE 1: Diagnóstico de GAPs y Auditoría de Reutilización (READ-ONLY)
Objetivo: Comparar la pantalla con el backend existente para verificar qué entidades (metales, piezas, inventario general, auditoría) ya existen y qué es estrictamente nuevo.
📋 Prompt para Antigravity IDE (Fase 1)
Ejecuta la Skill demo-gap-analysis en modo SOLO LECTURA (READ-ONLY) sobre el módulo [NOMBRE_MODULO] de Martela.

Fuentes a evaluar:
- Frontend Demo: /frontend/src/app/modules/[NOMBRE_MODULO]/
- Backend: /backend/src/
- Migraciones BD: /backend/migrations/ (Alembic o Flyway)

REGLAS STRICTAS:
1. MODO READ-ONLY: Cero modificaciones o creaciones de código fuente.
2. AUDITORÍA DE REUTILIZACIÓN: Examina entidades, modelos ORM y controladores existentes.
   - Si una tabla o endpoint ya existe (ej. catálogo de metales o usuarios), DEBE ADAPTARSE y EXTENDERSE.
   - Solo se propondrá crear código nuevo si el elemento no existe.
3. DETECCIÓN DE GAPs: Clasifica las discrepancias en MISSING, PARTIAL, INCORRECT, VISUAL, DATA.
4. Genera el informe de brechas en /docs/gap-analysis/gap-report-[NOMBRE_MODULO].md.
FASE 2: Generación del Plano Técnico (SDD)
Objetivo: Diseñar la orden de trabajo técnica detallando los scripts de migración de base de datos, los contratos REST y el adaptador HTTP.
📋 Prompt para Antigravity IDE (Fase 2)
Actúa como Lead Architect en SyborX.
Lee el reporte de brechas en /docs/gap-analysis/gap-report-[NOMBRE_MODULO].md y las migraciones de base de datos existentes.

Genera el Documento de Diseño de Software en /docs/sdd/sdd-[NOMBRE_MODULO].md especificando:
1. PLAN DE REUTILIZACIÓN: Modelos y servicios del backend existentes que se reutilizarán.
2. MIGRACIÓN SQL DDL: Script exacto de migración (Alembic en Python o Flyway en Java/SQL) para crear o alterar tablas respetando campos de joyería (peso decimal, quilataje, certificados gemológicos).
3. CONTRATOS REST Y DTOs: Esquemas Request/Response con validación estricta de tipos.
4. ADAPTADOR HTTP FRONTEND: Estructura de la clase `[Modulo]HttpAdapter` implementando la interfaz `[Modulo]Repository`.
5. PLAN DE VALIDACIÓN ORÁCULO EN PLAYWRIGHT.

Genera ÚNICAMENTE el archivo SDD. NO modifiques código fuente todavía.
🛑 PUNTO DE CONTROL HUMANO #1 (APROBACIÓN DEL ARQUITECTO)
Acción: El Arquitecto de Software revisa /docs/sdd/sdd-[NOMBRE_MODULO].md.
Criterios: Confirmar que los tipos de datos para oro usen precisión decimal adecuada (DECIMAL(10,3) o superior), que no se dupliquen tablas y que la seguridad/autenticación esté contemplada.
Respuesta del Arquitecto: "SDD Aprobado. Procede con la Fase 3".
FASE 3: Construcción e Integración Fullstack
Objetivo: Ejecutar los cambios de base de datos, implementar el backend y conmutar la Feature Flag en el frontend.
📋 Prompt para Antigravity IDE (Fase 3 - Tras Aprobación)
Ejecuta la Skill demo-gap-implementation para migrar el módulo [NOMBRE_MODULO] usando la orden de trabajo en /docs/sdd/sdd-[NOMBRE_MODULO].md.

Pasos secuenciales:
1. BASE DE DATOS: Aplica la migración de base de datos especificada (Alembic / Flyway).
2. BACKEND:
   - Adapta y extiende los modelos y endpoints existentes señalados en el SDD.
   - Crea los nuevos controladores y servicios de dominio necesarios para los cálculos de inventario de oro/joyas.
3. FRONTEND:
   - Implementa la clase `[Modulo]HttpAdapter` conectando al backend real mediante llamadas HTTP.
   - Conmuta la Feature Flag (`environment.features.[modulo]Backend = true`) para inyectar `[Modulo]HttpAdapter`.
4. RESTRICCIÓN VISUAL: Las plantillas HTML y los estilos CSS/SCSS en el Frontend DEBEN PERMANECER 100% INTACTOS.

Verifica la compilación del frontend y backend al finalizar.
FASE 4: Inspección de Calidad y Oráculo con Playwright
Objetivo: Verificar que el sistema integrado con la base de datos real funcione idénticamente a la demo y no presente alteraciones visuales ni errores en consola.
📋 Prompt para Antigravity IDE (Fase 4)
Actúa como QA Automation Lead en SyborX.

Ejecuta la FASE 4: VALIDACIÓN Y ORÁCULO DE COMPORTAMIENTO con Playwright para el módulo [NOMBRE_MODULO] de Martela.

Instrucciones:
1. Ejecuta la suite E2E en /frontend/e2e/[NOMBRE_MODULO].spec.ts contra el servidor integrado (Backend real + PostgreSQL).
2. Valida los flujos de negocio (alta de piezas de joyería, pesaje y balance de oro en gramos, traspasos, filtros y modales).
3. Monitorea eventos de consola (`page.on('console')` y `page.on('pageerror')`). La prueba DEBE MARCAR FAIL ante errores HTTP 500 o excepciones JavaScript no capturadas.
4. Ejecuta la comparación visual (`toHaveScreenshot({ maxDiffPixelRatio: 0.01 })`) comparando la vista real contra la demo aprobada.
5. Genera el reporte final en /docs/gap-analysis/e2e-report-[NOMBRE_MODULO].md.
🛑 PUNTO DE CONTROL HUMANO #2 (FIRMA DE LANZAMIENTO Y MERGE)
Criterios de Aprobación:
El reporte /docs/gap-analysis/e2e-report-[NOMBRE_MODULO].md registra estado PASS sin errores en consola ni discrepancias visuales.
Los datos de pesaje y quilataje persisten exactamente en PostgreSQL.
Resultado: El Arquitecto y el Líder de Negocio firman el Pull Request y se autoriza el despliegue del módulo.