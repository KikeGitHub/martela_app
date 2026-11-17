import { InjectionToken } from '@angular/core';

export type QuilatajeOro = '24k' | '18k' | '14k' | '10k';

export interface LoteOro {
  id: string;
  tipoMateria: 'LINGOTE' | 'PEDACERIA' | 'GRANALLA' | 'FUNDICION';
  quilataje: QuilatajeOro;
  /** Peso bruto en gramos con precisión de 3 decimales (0.000g) */
  pesoBrutoGramos: number;
  /** Peso fino puro (24k equivalente) en gramos (0.000g) */
  pesoFinoGramos: number;
  /** Merma permitida en gramos (0.000g) */
  mermaPermitidaGramos: number;
  /** Costo por gramo según FIX vigente */
  costoPorGramoMxn: number;
  fechaRegistro: string;
}

export interface BalanceOroResumen {
  totalPesoBrutoGramos: number;
  totalPesoFinoGramos: number;
  spotFixAplicadoUsd: number;
  valuacionTotalMxn: number;
}

/**
 * Puerto de salida (Repository) del módulo control-oro.
 * Los componentes Angular dependen exclusivamente de este contrato.
 */
export interface ControlOroRepository {
  obtenerLotes(): Promise<LoteOro[]>;
  registrarLote(lote: Omit<LoteOro, 'id' | 'pesoFinoGramos' | 'fechaRegistro'>): Promise<LoteOro>;
  calcularBalanceResumen(): Promise<BalanceOroResumen>;
}

export const CONTROL_ORO_REPOSITORY = new InjectionToken<ControlOroRepository>('CONTROL_ORO_REPOSITORY');

