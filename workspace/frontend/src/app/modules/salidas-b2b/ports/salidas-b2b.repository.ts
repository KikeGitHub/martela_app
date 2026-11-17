import { InjectionToken } from '@angular/core';

export interface RenglonLayoutOficial16Columnas {
  consecutivo: number;
  centroLogistico: string;
  modeloMartela: string;
  codigoBarrasSku: string;
  descripcion: string;
  kilataje: string;
  cantidad: number;
  pesoBruto: number;
  pesoNetoOro: number;
  costoMo: number;
  costoMetal: number;
  totalMartela: number;
  margenMls70: number;
  costoPublicoConIva: number;
  oroFinoPuro: number;
  facturaSae: string;
}

export interface SalidaRemisionB2b {
  idRemision: number;
  folioRemision: string;
  centroLogistico: string;
  facturaSae: string;
  /** Ejemplo: FOLIO: Z008340 */
  selloSeguridadBolsa: string;
  totalPiezas: number;
  pesoBrutoTotalG: number;
  pesoNetoOroG: number;
  oroFinoTotalG: number;
  importeTotal: number;
  estatus: 'PREPARADO' | 'EN_RUTA' | 'ENTREGADO';
}

export interface SalidasB2bRepository {
  listarRemisiones(): Promise<SalidaRemisionB2b[]>;
  generarLayoutOficial16Columnas(idRemision: number): Promise<RenglonLayoutOficial16Columnas[]>;
  registrarSelloBolsa(idRemision: number, selloSeguridadBolsa: string, pesoBolsaG: number): Promise<SalidaRemisionB2b>;
}

export const SALIDAS_B2B_REPOSITORY = new InjectionToken<SalidasB2bRepository>(
  'SALIDAS_B2B_REPOSITORY'
);

