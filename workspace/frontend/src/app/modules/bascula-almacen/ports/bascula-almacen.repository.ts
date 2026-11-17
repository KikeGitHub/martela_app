import { InjectionToken } from '@angular/core';

export type AlmacenTipoMartela = 'BOVEDA_ORO' | 'RACK_PLATA' | 'TAPANCO_FANTASIA' | 'DEFECTOS';
export type EstatusSubPieza = 'DISPONIBLE' | 'APARTADO_RUTA' | 'ENTREGADO' | 'FUNDICION';

export interface UbicacionGaveta {
  idUbicacion: number;
  almacen: AlmacenTipoMartela;
  rack: string;
  nivel: string;
  gaveta: string;
  /** Ejemplo: BOVEDA-R1-N2-G05 o TAPANCO-R2-N1-G12 */
  codigoCompleto: string;
}

export interface SubPiezaInventarioIndividual {
  idPieza: string;
  skuRef: string;
  idRecepcion?: number;
  idUbicacion: number;
  codigoGaveta: string;
  /** Peso bruto leído en báscula con precisión de 4 decimales (0.0000 g) */
  pesoBrutoG: number;
  /** Peso de circonia (CZ) deducido del SKU (0.0000 g) */
  pesoPiedraG: number;
  /** Peso neto de metal precioso: pesoBrutoG - pesoPiedraG (0.0000 g) */
  pesoNetoMetalG: number;
  /** Gramos de Oro Fino puro a 5 decimales: pesoNetoMetalG * factorOroFino */
  gramosOroFino: number;
  estatus: EstatusSubPieza;
  fechaPesaje: string;
}

export interface BasculaAlmacenRepository {
  listarGavetas(): Promise<UbicacionGaveta[]>;
  pesarSubPieza(payload: {
    skuRef: string;
    pesoBrutoG: number;
    pesoPiedraCzCatalogoG: number;
    factorOroFinoCatalogo: number;
    idUbicacion: number;
    codigoGaveta: string;
  }): Promise<SubPiezaInventarioIndividual>;
  obtenerExistenciasPorSku(sku: string): Promise<SubPiezaInventarioIndividual[]>;
}

export const BASCULA_ALMACEN_REPOSITORY = new InjectionToken<BasculaAlmacenRepository>(
  'BASCULA_ALMACEN_REPOSITORY'
);

