import { InjectionToken } from '@angular/core';

export type EstatusRecepcionValija = 'EN_REVISION' | 'CONCILIADO' | 'CON_DISCREPANCIA';
export type DestinoSemaforoCalidad = 'APROBADA' | 'REPARACION' | 'MERMA';

export interface InspeccionCalidadRow {
  idInspeccion: number;
  idRecepcion: number;
  sku: string;
  piezasRecibidas: number;
  piezasAprobadas: number;
  piezasReparacionInterna: number;
  piezasMermaFundicion: number;
  observacionesTecnicas?: string;
}

export interface RecepcionPaqueteria {
  idRecepcion: number;
  guiaTracking: string;
  idProveedor: number;
  totalBultos: number;
  pesoBrutoPaqueteG: number;
  urlVideoEvidencia: string;
  estatus: EstatusRecepcionValija;
  observaciones?: string;
  fechaLlegada: string;
  inspecciones: InspeccionCalidadRow[];
}

export interface RecepcionCalidadRepository {
  listarRecepciones(): Promise<RecepcionPaqueteria[]>;
  registrarRecepcion(
    data: Omit<RecepcionPaqueteria, 'idRecepcion' | 'estatus' | 'fechaLlegada' | 'inspecciones'>
  ): Promise<RecepcionPaqueteria>;
  incrementarSemaforo(
    idInspeccion: number,
    destino: DestinoSemaforoCalidad,
    delta?: number
  ): Promise<InspeccionCalidadRow>;
  cerrarDictamenCalidad(idRecepcion: number): Promise<RecepcionPaqueteria>;
}

export const RECEPCION_CALIDAD_REPOSITORY = new InjectionToken<RecepcionCalidadRepository>(
  'RECEPCION_CALIDAD_REPOSITORY'
);

