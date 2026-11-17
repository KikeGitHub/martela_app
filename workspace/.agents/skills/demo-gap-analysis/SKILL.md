---
name: demo-gap-analysis
description: Ejecuta el diagnóstico de brechas (GAPs) en modo estricto SOLO LECTURA (READ-ONLY) y auditoría de reutilización (Audit-First) entre la Demo/Frontend de Martela y el Backend/Base de Datos existente.
---

# Skill: Demo GAP Analysis (SDOP Fase 1)

Esta skill implementa la **Fase 1: Diagnóstico de GAPs y Auditoría de Reutilización (READ-ONLY)** del Manual de Operación SDOP para el proyecto **Martela (Joyería y Oro)**.

## Reglas Inmutables de Ejecución

1. **MODO ESTRICTO SOLO LECTURA (READ-ONLY)**:
   - Queda estrictamente prohibido modificar, crear o eliminar archivos de código fuente en `/frontend/`, `/backend/` o `/demo/`.
   - El único archivo que esta skill puede generar o actualizar es el reporte en `/docs/gap-analysis/gap-report-[NOMBRE_MODULO].md`.

2. **AUDITORÍA DE REUTILIZACIÓN (AUDIT-FIRST)**:
   - Antes de proponer cualquier tabla, entidad JPA o controlador REST nuevo, inspecciona exhaustivamente:
     - `/backend/domain/ports/out/`
     - `/backend/infrastructure/persistence/` (entidades y migraciones Flyway)
     - `/backend/application/usecase/`
   - Si un catálogo o entidad ya existe (ej. metales, quilatajes, sucursales, usuarios, bitácora de auditoría), **DEBE ADAPTARSE Y EXTENDERSE**. Prohibido duplicar tablas o endpoints.

3. **PRECISIÓN DE DOMINIO (JOYERÍA Y ORO)**:
   - Verifica que todos los campos de gramaje contemplen precisión decimal estricta (`DECIMAL(10,3)` o superior para peso bruto, peso fino y mermas).
   - Verifica soporte para quilataje (`24k`, `18k`, `14k`, `10k`), precio spot/FIX dinámico, número de serie individual por pieza física (`PZ-YYYY-NNNN`) y certificados gemológicos.

## Fuentes a Evaluar

- **Prototipo Aprobado**: `/demo/`
- **Módulo Frontend**: `/frontend/src/app/modules/[NOMBRE_MODULO]/` (plantilla `.html`, estilos `.scss`, componente `.ts`, `ports/[modulo].repository.ts` y `adapters/[modulo]-localstorage.adapter.ts`)
- **Backend y Persistencia**: `/backend/` y migraciones SQL en `/backend/infrastructure/persistence/migrations/`

## Clasificación de Discrepancias (GAPs)

Clasifica cada hallazgo dentro del reporte usando las siguientes categorías:
- `MISSING`: Funcionalidad, endpoint, tabla o columna presente en el frontend/demo pero inexistente en el backend.
- `PARTIAL`: Entidad o endpoint existente en el backend que requiere extensión de campos o reglas de negocio.
- `INCORRECT`: Discrepancia en tipos de datos (ej. `FLOAT` en lugar de `DECIMAL(10,3)` para gramos de oro) o fórmula de negocio.
- `VISUAL`: Diferencia entre el componente en `/frontend/` y la referencia visual en `/demo/`.
- `DATA`: Diferencia en catálogos semilla, estructura de DTOs o contratos en `[Modulo]Repository`.

## Plantilla de Salida (`/docs/gap-analysis/gap-report-[NOMBRE_MODULO].md`)

```markdown
# Reporte de Análisis de GAPs — Módulo: [NOMBRE_MODULO]

- **Fecha**: YYYY-MM-DD
- **Modo**: READ-ONLY (Audit-First)
- **Estado**: Pendiente de generación de SDD (Fase 2)

## 1. Inventario de Artefactos Evaluados
- **Frontend / Demo**: ...
- **Backend / BD**: ...

## 2. Auditoría de Reutilización (Activos Existentes)
| Activo Backend / Tabla | Estado Actual | Acción Recomendada (Reutilizar / Extender) |
| :--- | :--- | :--- |

## 3. Matriz de Brechas (GAPs Detectados)
| ID | Categoría (`MISSING` \| `PARTIAL` \| `INCORRECT` \| `VISUAL` \| `DATA`) | Descripción | Impacto en Dominio (Oro/Joyería) | Solución Propuesta |
| :--- | :--- | :--- | :--- | :--- |

## 4. Requisitos para el Plano SDD (Fase 2)
- Cambios requeridos en Flyway SQL (`DECIMAL(10,3)`, constraints, índices).
- Contratos REST y DTOs requeridos por `[Modulo]HttpAdapter`.
```

