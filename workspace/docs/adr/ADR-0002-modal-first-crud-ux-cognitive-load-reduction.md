# ADR-0002: Arquitectura UX Modal-First CRUD y Reducción de Complejidad Cognitiva para Operarios de Joyería

- **Estado**: Aceptado
- **Fecha**: 2026-11-16
- **Proyecto**: Martela (Joyería Fina y Control de Oro)
- **Autor**: Arquitectura de Software & Diseño UX Industrial

---

## 1. Contexto y Problemática

En las primeras iteraciones de la plataforma MARTELA (Fase 0 y maquetaciones iniciales), varios módulos (en especial el **Módulo 1: Catálogo Maestro y Matriz CZ**) presentaban un antipatrón visual de diseño:
1. **Sobrecarga Cognitiva y "Scroll Fatigue"**: El formulario de captura y edición de modelos se encontraba incrustado al pie de la página, por debajo de la tabla principal de datos.
2. **Desorientación de Usuario No Técnico**: Los usuarios finales del sistema (operadores de almacén, pesadores en bóveda, personal de aduanas y choferes de reparto) son perfiles con baja alfabetización digital. Al presionar "Editar" o hacer clic en un renglón, la pantalla realizaba un desplazamiento vertical forzado (*smooth scroll*) o requería que el usuario dedujera que el formulario inferior se había actualizado, provocando confusión, sensación de pérdida de contexto ("¿dónde se fue mi fila?") y errores de recaptura.
3. **Ausencia de Certeza en Acciones Críticas (Loading States)**: Al guardar, calibrar pedrería o mover inventario físico, los botones no exhibían indicadores visuales de procesamiento (spinners, bloqueo de clicks concurrentes), ocasionando envíos duplicados (*double submit*).

---

## 2. Decisión Arquitectónica

Se adopta como estándar corporativo el patrón **Modal-First CRUD con Retroalimentación Determinística**:

### A. Eliminación Total de Formularios Apilados (Zero Inline Clutter)
- Las pantallas principales de los 6 módulos se depuran para mostrar exclusivamente:
  - Encabezado con título claro, breadcrumb y acciones primarias destacadas.
  - Tarjetas KPI superiores de resumen operativo.
  - Barra de búsqueda reactiva (debounce 300ms) y filtros ergonómicos.
  - Tabla de datos limpios con paginación/conteo.
- **Queda estrictamente prohibido colocar formularios de edición o alta empotrados al pie de las tablas de datos.**

### B. Ventanas Modales de Enfoque Aislado (Focus-Trap Modals)
- Cada acción de creación (`＋ Nuevo`) o modificación (`✏️ Editar`) abre una ventana modal centrada con capa de atenuación (*backdrop blur*):
  - **Foco único**: El usuario concentra su atención exclusivamente en los campos requeridos, sin distracciones de la grilla de fondo.
  - **Distribución en 2 Columnas**: 
    - *Columna Izquierda*: Campos esenciales de captura con etiquetas en español llano y botones de atajo rápido (ej. pesos estándar de circonia: `0.0000g`, `0.1800g`, `0.3600g`, `0.7200g`, `1.1200g`).
    - *Columna Derecha*: Tarjeta visual técnica de previsualización en vivo (Joyelero Preview Card) que recalcula en tiempo real el descuento de circonia, el metal neto y los gramos de Oro Fino puro (24K).
  - **Escape No Destructivo**: Soporte nativo para cerrar con la tecla `Escape`, botón visible `✕` o clic fuera del modal sin alterar los datos persistidos.

### C. Ciclo de Retroalimentación Determinística (Loading State Loop)
Toda mutación de datos (guardado, calibración, eliminación o pesaje) debe implementar el siguiente ciclo de 4 pasos:
1. **Invocación y Bloqueo**: Se deshabilita el botón de acción para prevenir doble clic (`btn.disabled = true`).
2. **Spinner Activo con Micro-copia**: El botón reemplaza su icono por un SVG circular giratorio (`animate-spin`) y muestra texto activo (ej. `Guardando en Catálogo...`, `Recalculando FIX...`).
3. **Persistencia y Cierre Limpio**: Se persiste en la capa de datos (`apiFacade` / Backend Spring Boot) y se destruye la ventana modal (`MartelaUI.closeModal()`).
4. **Toast de Confirmación & Refresco Dinámico**: Se despliega una notificación flotante de éxito (`MartelaUI.toast`) con el detalle del folio/SKU afectado y se refresca únicamente la tabla de datos sin recargar la página.

---

## 3. Consecuencias y Beneficios

| Aspecto | Antes (Formulario al Pie) | Después (Modal-First CRUD) |
| :--- | :--- | :--- |
| **Carga Cognitiva** | Alta: tabla + 15 inputs visibles simultáneamente. | Mínima: tabla limpia; formulario solo a petición. |
| **Scroll de Pantalla** | Excesivo (fatiga de navegación en laptops/tablets). | Cero scroll necesario para iniciar una edición. |
| **Prevención de Errores** | Regular (campos editados inadvertidamente al navegar). | Alta (entorno modal aislado con confirmación explícita). |
| **Tiempos de Capacitación** | Días (los operadores se perdían en la pantalla). | Minutos (flujo universal: *Ver fila → Clic Editar → Guardar*). |
| **Riesgo Doble Envío** | Presente (clic repetido por falta de feedback). | Nulo (bloqueo automático y spinner de procesamiento). |

---

## 4. Gobernanza en Fase 3 (Angular + Spring Boot)

Esta decisión se traslada a los componentes productivos en Angular:
- Uso de componentes modales standalone (`MatDialog` o Dialogs Tailwind accesibles con `@if (isOpen())`).
- Manejo reactivo de estado con `Signals` y deshabilitado reactivo (`[disabled]="isLoading()"`).
- Micro-animaciones CSS uniformes mediante `@keyframes fadeInModal` y `.animate-spin`.

