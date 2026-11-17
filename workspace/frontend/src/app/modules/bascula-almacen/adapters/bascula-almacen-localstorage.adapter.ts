import { Injectable } from '@angular/core';
import {
  BasculaAlmacenRepository,
  SubPiezaInventarioIndividual,
  UbicacionGaveta,
} from '../ports/bascula-almacen.repository';

const STORAGE_KEY = 'martela_sdop_bascula_almacen';

@Injectable()
export class BasculaAlmacenLocalStorageAdapter implements BasculaAlmacenRepository {
  async listarGavetas(): Promise<UbicacionGaveta[]> {
    return [
      { idUbicacion: 1, almacen: 'BOVEDA_ORO', rack: 'R1', nivel: 'N1', gaveta: 'G01', codigoCompleto: 'BOVEDA-R1-N1-G01' },
      { idUbicacion: 2, almacen: 'BOVEDA_ORO', rack: 'R1', nivel: 'N2', gaveta: 'G05', codigoCompleto: 'BOVEDA-R1-N2-G05' },
      { idUbicacion: 3, almacen: 'RACK_PLATA', rack: 'R1', nivel: 'N1', gaveta: 'G02', codigoCompleto: 'RACK_PLATA-R1-N1-G02' },
      { idUbicacion: 4, almacen: 'TAPANCO_FANTASIA', rack: 'R2', nivel: 'N1', gaveta: 'G12', codigoCompleto: 'TAPANCO-R2-N1-G12' },
    ];
  }

  async pesarSubPieza(payload: {
    skuRef: string;
    pesoBrutoG: number;
    pesoPiedraCzCatalogoG: number;
    factorOroFinoCatalogo: number;
    idUbicacion: number;
    codigoGaveta: string;
  }): Promise<SubPiezaInventarioIndividual> {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: SubPiezaInventarioIndividual[] = raw ? JSON.parse(raw) : [];

    const bruto = Number(payload.pesoBrutoG.toFixed(4));
    const piedra = Number(payload.pesoPiedraCzCatalogoG.toFixed(4));
    const neto = Number(Math.max(0.01, bruto - piedra).toFixed(4));
    const oroFino = Number((neto * payload.factorOroFinoCatalogo).toFixed(5));

    const nueva: SubPiezaInventarioIndividual = {
      idPieza: `PZ-2026-${String(items.length + 1).padStart(4, '0')}`,
      skuRef: payload.skuRef,
      idUbicacion: payload.idUbicacion,
      codigoGaveta: payload.codigoGaveta,
      pesoBrutoG: bruto,
      pesoPiedraG: piedra,
      pesoNetoMetalG: neto,
      gramosOroFino: oroFino,
      estatus: 'DISPONIBLE',
      fechaPesaje: new Date().toISOString(),
    };

    items.unshift(nueva);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return nueva;
  }

  async obtenerExistenciasPorSku(sku: string): Promise<SubPiezaInventarioIndividual[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: SubPiezaInventarioIndividual[] = raw ? JSON.parse(raw) : [];
    return items.filter((p) => p.skuRef === sku);
  }
}

