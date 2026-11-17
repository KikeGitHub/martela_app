# Índice Maestro de Documentos de Diseño de Software (SDD) — MARTELA 6 Módulos Core

Este directorio contiene los **Software Design Documents (SDD)** para cada uno de los 6 módulos de alto impacto de la plataforma MARTELA, diseñados bajo el **Framework SDOP (Spec-Driven Oracle-Bridge)** y aprobados con la **Arquitectura UX Modal-First CRUD**:

---

## 📚 Índice de Módulos Core SDOP

| ID | Documento SDD | Módulo Operativo | Enfoque UX y Reglas Clave |
| :---: | :--- | :--- | :--- |
| **01** | [SDD-MODULO-01-CATALOGO-MATRIZ-CZ.md](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/sdd/SDD-MODULO-01-CATALOGO-MATRIZ-CZ.md) | **1. Catálogo & Matriz CZ** | Modal CRUD 2 columnas, live card, chips CZ rápidos, GTIN-14. |
| **02** | [SDD-MODULO-02-RECEPCION-CALIDAD.md](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/sdd/SDD-MODULO-02-RECEPCION-CALIDAD.md) | **2. Recepción & Calidad** | Modal alta de valija, video 1080p sin cortes, semáforo +1 táctil. |
| **03** | [SDD-MODULO-03-BASCULA-GAVETAS.md](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/sdd/SDD-MODULO-03-BASCULA-GAVETAS.md) | **3. Báscula & Gavetas** | Terminal digital 0.0000g, descuento CZ, atajo Enter, etiqueta térmica. |
| **04** | [SDD-MODULO-04-MOTOR-FIX-BIPARTITA.md](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/sdd/SDD-MODULO-04-MOTOR-FIX-BIPARTITA.md) | **4. Motor Fix & Bipartita** | Regla Tarifa Máxima Fix (Hoy vs Ayer), cuenta maquila 24K Montepío. |
| **05** | [SDD-MODULO-05-DESPIECE-B2B-COPPEL.md](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/sdd/SDD-MODULO-05-DESPIECE-B2B-COPPEL.md) | **5. Despiece B2B & Excel** | Asignación 438 pzs, sellos plásticos, layout oficial 16 columnas. |
| **06** | [SDD-MODULO-06-LOGISTICA-PWA-PLD.md](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/sdd/SDD-MODULO-06-LOGISTICA-PWA-PLD.md) | **6. Logística PWA & PLD** | PWA móvil, canvas firma digital, coordenadas GPS, hash SHA-256 UIF. |

---

## 🏛️ Decisiones de Arquitectura Vinculadas (ADR)
- [ADR-0001: Adopción del Framework SDOP, Patrón Bridge Dual y Arquitectura Hexagonal](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0001-sdop-hexagonal-bridge-architecture.md)
- [ADR-0002: Arquitectura UX Modal-First CRUD y Reducción de Complejidad Cognitiva](file:///c:/Users/kike2/OneDrive/Escritorio/FullStack%20Pojects/Martela/martela-app/workspace/docs/adr/ADR-0002-modal-first-crud-ux-cognitive-load-reduction.md)

---

## 📋 Estructura Estándar de Cada SDD
1. **Plan de Reutilización (Audit-First)**: Mapeo de entidades, modelos JPA y puertos sin duplicidad.
2. **Migración SQL DDL (Flyway)**: Esquema de base de datos PostgreSQL con precisión numérica estricta y columnas calculadas.
3. **Contratos REST y DTOs**: Endpoints, esquemas JSON y validaciones `@NotNull`, `@Pattern`, `@Positive`.
4. **Arquitectura Frontend & UX**: Patrón Modal-First, deshabilitado de botones, loading indicators y toasters.
5. **Plan de Validación Oráculo (Playwright)**: Casos de prueba automatizados con aserciones y 0 errores en consola.
