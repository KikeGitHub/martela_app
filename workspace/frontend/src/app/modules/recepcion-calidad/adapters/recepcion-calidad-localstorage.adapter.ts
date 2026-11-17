import { Injectable } from '@angular/core';
import {
  DestinoSemaforoCalidad,
  InspeccionCalidadRow,
  RecepcionCalidadRepository,
  RecepcionPaqueteria,
} from '../ports/recepcion-calidad.repository';

const STORAGE_KEY = 'martela_sdop_recepcion_calidad';

@Injectable()
export class RecepcionCalidadLocalStorageAdapter implements RecepcionCalidadRepository {
  async listarRecepciones(): Promise<RecepcionPaqueteria[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async registrarRecepcion(
    data: Omit<RecepcionPaqueteria, 'idRecepcion' | 'estatus' | 'fechaLlegada' | 'inspecciones'>
  ): Promise<RecepcionPaqueteria> {
    const list = await this.listarRecepciones();
    const record: RecepcionPaqueteria = {
      ...data,
      idRecepcion: Date.now(),
      pesoBrutoPaqueteG: Number(data.pesoBrutoPaqueteG.toFixed(2)),
      estatus: 'EN_REVISION',
      fechaLlegada: new Date().toISOString(),
      inspecciones: [],
    };
    list.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return record;
  }

  async incrementarSemaforo(
    idInspeccion: number,
    destino: DestinoSemaforoCalidad,
    delta = 1
  ): Promise<InspeccionCalidadRow> {
    const list = await this.listarRecepciones();
    for (const rec of list) {
      const row = rec.inspecciones.find((i) => i.idInspeccion === idInspeccion);
      if (row) {
        if (destino === 'APROBADA') row.piezasAprobadas += delta;
        if (destino === 'REPARACION') row.piezasReparacionInterna += delta;
        if (destino === 'MERMA') row.piezasMermaFundicion += delta;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
        return row;
      }
    }
    throw new Error(`Inspección ${idInspeccion} no encontrada`);
  }

  async cerrarDictamenCalidad(idRecepcion: number): Promise<RecepcionPaqueteria> {
    const list = await this.listarRecepciones();
    const rec = list.find((r) => r.idRecepcion === idRecepcion);
    if (!rec) throw new Error(`Recepción ${idRecepcion} no encontrada`);
    const hasMerma = rec.inspecciones.some((i) => i.piezasMermaFundicion > 0);
    rec.estatus = hasMerma ? 'CON_DISCREPANCIA' : 'CONCILIADO';
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return rec;
  }
}

