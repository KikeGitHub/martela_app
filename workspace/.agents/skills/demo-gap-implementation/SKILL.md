---
name: demo-gap-implementation
description: Ejecuta la integración Fullstack (Fase 3) de un módulo de Martela siguiendo estrictamente un Documento de Diseño de Software (SDD) previamente aprobado por el Arquitecto humano.
---

# Skill: Demo GAP Implementation (SDOP Fase 3)

Esta skill implementa la **Fase 3: Construcción e Integración Fullstack** del Manual de Operación SDOP para el proyecto **Martela (Joyería y Oro)**.

## Prerrequisito Obligatorio (Gobernanza Human-in-the-Loop)

- **CONTROL HUMANO #1**: Antes de ejecutar esta skill, debe existir el archivo `/docs/sdd/sdd-[NOMBRE_MODULO].md` y contar con la aprobación explícita del Arquitecto humano (*"SDD Aprobado. Procede con la Fase 3"*).
- Si el SDD no existe o no ha sido aprobado, detén la ejecución y solicita la aprobación correspondiente.

## Secuencia Estricta de Implementación

### Paso 1: Base de Datos (Migraciones Flyway)
- Crea o aplica la migración SQL en `/backend/infrastructure/persistence/migrations/` tal como se especifica en la sección **MIGRACIÓN SQL DDL** del SDD.
- Garantiza que todos los pesos de metales preciosos (`peso_bruto_gramos`, `peso_fino_gramos`, `merma_gramos`) utilicen `DECIMAL(10,3)` o superior y que las cotizaciones monetarias usen `DECIMAL(14,4)` o superior.

### Paso 2: Backend (Spring Boot — Arquitectura Hexagonal)
- **Reutilización**: Adapta y extiende las entidades JPA, adaptadores y servicios existentes indicados en el Plan de Reutilización del SDD sin duplicar tablas ni controladores.
- **Puertos de Salida (`/backend/domain/ports/out/`)**: Define o extiende las interfaces `RepositoryPort` desacopladas de la infraestructura.
- **Casos de Uso (`/backend/application/usecase/`)**: Implementa la lógica de dominio (cálculo de peso fino por quilataje `24k/18k/14k/10k`, regla de protección FIX Hoy vs. Ayer, control de mermas térmicas vs. rebabas recuperables).
- **Persistencia y Web (`/backend/infrastructure/persistence/`)**: Implementa los adaptadores JPA y controladores REST cumpliendo los contratos DTO del SDD.

### Paso 3: Frontend (Patrón Bridge y Adaptadores Duales en Angular)
- Implementa `/frontend/src/app/modules/[NOMBRE_MODULO]/adapters/[modulo]-http.adapter.ts` implementando la interfaz `ports/[modulo].repository.ts`.
- Conmuta la Feature Flag correspondiente en `/frontend/src/environments/environment.ts` (`environment.features.[modulo]Backend = true`) para inyectar `[Modulo]HttpAdapter` en lugar de `[Modulo]LocalStorageAdapter`.

### Paso 4: Restricción Visual Inmutable
- **PROHIBIDO** alterar la estructura visual aprobada en `/frontend/src/app/modules/[NOMBRE_MODULO]/[modulo].component.html` ni los estilos en `[modulo].component.scss` durante la integración de datos.
- La vista conectada al backend real debe superar la validación del **Oráculo Playwright** (`toHaveScreenshot({ maxDiffPixelRatio: 0.01 })`) en la Fase 4.

