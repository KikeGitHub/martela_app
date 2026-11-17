import { InjectionToken } from '@angular/core';
import { QuilatajeOro } from '../../control-oro/ports/control-oro.repository';

export type EstatusPiezaJoya = 'EN_VITRINA' | 'APARTADO' | 'EN_TALLER' | 'BOVEDA' | 'VENDIDO';
export type TipoPiezaJoya = 'ANILLO' | 'CADENA' | 'PULSERA' | 'ARETE' | 'DIJE';

export interface PiezaJoya {
  serial: string;
  sku: string;
  nombreModelo: string;
  tipoPieza: TipoPiezaJoya;
  quilataje: QuilatajeOro;
  /** Peso individual en báscula con precisión de 3 decimales (0.000g) */
  pesoBrutoGramos: number;
  pedreriaGemas?: string;
  certificadoGemologico?: string;
  estatus: EstatusPiezaJoya;
  ubicacionAlmacen: string;
  fechaIngreso: string;
}

/**
 * Puerto de salida (Repository) del módulo inventario-joyas.
 * Los componentes Angular dependen exclusivamente de este contrato.
 */
export interface InventarioJoyasRepository {
  listarPiezas(filtroSku?: string): Promise<PiezaJoya[]>;
  registrarPieza(pieza: Omit<PiezaJoya, 'fechaIngreso'>): Promise<PiezaJoya>;
  actualizarEstatus(serial: string, nuevoEstatus: EstatusPiezaJoya): Promise<PiezaJoya>;
}

export const INVENTARIO_JOYAS_REPOSITORY = new InjectionToken<InventarioJoyasRepository>(
  'INVENTARIO_JOYAS_REPOSITORY'
);

