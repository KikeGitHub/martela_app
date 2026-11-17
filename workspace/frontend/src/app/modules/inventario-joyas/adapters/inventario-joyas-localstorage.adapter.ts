import { Injectable } from '@angular/core';
import {
  EstatusPiezaJoya,
  InventarioJoyasRepository,
  PiezaJoya,
} from '../ports/inventario-joyas.repository';

const STORAGE_KEY = 'martela_sdop_inventario_joyas';

/**
 * Adaptador Mock (Fase 0 - Demo) que persiste y lee piezas de joyería en LocalStorage.
 */
@Injectable()
export class InventarioJoyasLocalStorageAdapter implements InventarioJoyasRepository {
  async listarPiezas(filtroSku?: string): Promise<PiezaJoya[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    const piezas: PiezaJoya[] = raw ? JSON.parse(raw) : [];
    if (!filtroSku) {
      return piezas;
    }
    return piezas.filter((p) => p.sku.toLowerCase().includes(filtroSku.toLowerCase()));
  }

  async registrarPieza(pieza: Omit<PiezaJoya, 'fechaIngreso'>): Promise<PiezaJoya> {
    const piezas = await this.listarPiezas();
    const nueva: PiezaJoya = {
      ...pieza,
      pesoBrutoGramos: Number(pieza.pesoBrutoGramos.toFixed(3)),
      fechaIngreso: new Date().toISOString(),
    };
    piezas.push(nueva);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(piezas));
    return nueva;
  }

  async actualizarEstatus(serial: string, nuevoEstatus: EstatusPiezaJoya): Promise<PiezaJoya> {
    const piezas = await this.listarPiezas();
    const idx = piezas.findIndex((p) => p.serial === serial);
    if (idx === -1) {
      throw new Error(`Pieza con serial ${serial} no encontrada`);
    }
    piezas[idx] = { ...piezas[idx], estatus: nuevoEstatus };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(piezas));
    return piezas[idx];
  }
}

