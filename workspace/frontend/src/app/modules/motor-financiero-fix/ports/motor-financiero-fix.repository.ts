import { InjectionToken } from '@angular/core';

export interface TasaMetalFixDia {
  fecha: string;
  fixOroHoyUsd: number;
  fixOroAyerUsd: number;
  /** Regla de Tarifa Máxima: max(fixOroHoyUsd, fixOroAyerUsd) */
  fixAplicado: number;
  tipoCambioUsdMxn: number;
  costoGramo10kMxn: number;
  costoGramo14kMxn: number;
  costoGramoPlataMxn: number;
}

export interface CotizacionBipartitaDTO {
  idPieza: string;
  pesoNetoMetalG: number;
  costoManoObra: number;
  costoMetal: number;
  subtotalMartela: number;
  margenCliente70: number;
  iva16: number;
  precioPublicoConIva: number;
  /** Gramos de Oro Fino puro a debitar de la cuenta maquila (5 decimales) */
  gramosOroFinoDebitar: number;
}

export interface MotorFinancieroFixRepository {
  obtenerTasasVigentes(): Promise<TasaMetalFixDia>;
  calcularLiquidacionBipartita(params: {
    idPieza: string;
    pesoNetoMetalG: number;
    costoMoGramos: number;
    metalTipo: 'ORO_10K' | 'ORO_14K' | 'PLATA_925';
  }): Promise<CotizacionBipartitaDTO>;
}

export const MOTOR_FINANCIERO_FIX_REPOSITORY = new InjectionToken<MotorFinancieroFixRepository>(
  'MOTOR_FINANCIERO_FIX_REPOSITORY'
);

