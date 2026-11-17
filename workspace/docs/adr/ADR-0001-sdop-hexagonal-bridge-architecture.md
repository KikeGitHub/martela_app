# ADR-0001: Adopción del Framework SDOP, Patrón Bridge Dual en Frontend y Arquitectura Hexagonal en Backend

- **Estado**: Aceptado
- **Fecha**: 2026-11-15
- **Proyecto**: Martela (Joyería Fina y Control de Oro)

## Contexto
Martela requiere migrar su Prueba de Concepto interactiva (`/demo`) hacia una plataforma productiva en **Angular + Spring Boot + PostgreSQL**, asegurando trazabilidad por pieza física con gramaje decimal exacto (`0.000g`), cotización FIX con regla de protección y control metalúrgico de fundición, sin perder la fidelidad visual aprobada por negocio ni duplicar entidades en el backend.

## Decisión
1. **Frontend (Angular — Patrón Bridge con Adaptadores Duales)**:
   - Ningún componente realiza peticiones HTTP directas.
   - Cada módulo define su contrato en `ports/[modulo].repository.ts`.
   - Mediante Feature Flags en `src/environments/environment.ts`, se conmuta entre `[Modulo]LocalStorageAdapter` (Fase 0) y `[Modulo]HttpAdapter` (Fase 3).
2. **Backend (Spring Boot — Arquitectura Hexagonal)**:
   - División estricta en `domain/ports/out/`, `application/usecase/` e `infrastructure/persistence/` (con migraciones Flyway).
   - Regla *Audit-First*: prohibido duplicar tablas o controladores existentes.
3. **Oráculo Playwright y Gobernanza Human-in-the-Loop**:
   - Dos puntos de control humano obligatorios: aprobación del SDD (`/docs/sdd/`) y firma del reporte E2E (`/docs/gap-analysis/`).

