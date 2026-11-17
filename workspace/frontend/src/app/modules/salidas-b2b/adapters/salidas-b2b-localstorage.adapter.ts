import { Injectable } from '@angular/core';
import {
  RenglonLayoutOficial16Columnas,
  SalidaRemisionB2b,
  SalidasB2bRepository,
} from '../ports/salidas-b2b.repository';

const STORAGE_KEY = 'martela_sdop_salidas_b2b';

@Injectable()
export class SalidasB2bLocalStorageAdapter implements SalidasB2bRepository {
  async listarRemisiones(): Promise<SalidaRemisionB2b[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
    return [
      {
        idRemision: 1,
        folioRemision: 'REM-2026-3032',
        centroLogistico: '3032 Cancún Centro',
        facturaSae: 'SAE-F-90812',
        selloSeguridadBolsa: 'Z008340',
        totalPiezas: 17,
        pesoBrutoTotalG: 48.25,
        pesoNetoOroG: 45.1900,
        oroFinoTotalG: 22.84510,
        importeTotal: 94520.00,
        estatus: 'PREPARADO',
      },
      {
        idRemision: 2,
        folioRemision: 'REM-2026-3050',
        centroLogistico: '3050 Santa Fe Avant',
        facturaSae: 'SAE-F-90813',
        selloSeguridadBolsa: 'Z008341',
        totalPiezas: 17,
        pesoBrutoTotalG: 51.40,
        pesoNetoOroG: 48.8200,
        oroFinoTotalG: 25.12040,
        importeTotal: 102480.00,
        estatus: 'PREPARADO',
      },
    ];
  }

  async generarLayoutOficial16Columnas(idRemision: number): Promise<RenglonLayoutOficial16Columnas[]> {
    const remisiones = await this.listarRemisiones();
    const rem = remisiones.find((r) => r.idRemision === idRemision) || remisiones[0];
    return [
      {
        consecutivo: 1,
        centroLogistico: rem.centroLogistico,
        modeloMartela: 'MRT-AN-1042',
        codigoBarrasSku: '07502278209688',
        descripcion: 'Anillo Solitario Imperial con Circonia Suiza Oro 10K [PZ-2026-0001]',
        kilataje: '10K',
        cantidad: 1,
        pesoBruto: 1.8520,
        pesoNetoOro: 1.6720,
        costoMo: 185.00,
        costoMetal: 1170.40,
        totalMartela: 1355.40,
        margenMls70: 948.78,
        costoPublicoConIva: 2672.85,
        oroFinoPuro: 0.69667,
        facturaSae: rem.facturaSae,
      },
    ];
  }

  async registrarSelloBolsa(
    idRemision: number,
    selloSeguridadBolsa: string,
    pesoBolsaG: number
  ): Promise<SalidaRemisionB2b> {
    const remisiones = await this.listarRemisiones();
    const rem = remisiones.find((r) => r.idRemision === idRemision);
    if (!rem) throw new Error(`Remisión ${idRemision} no encontrada`);
    rem.selloSeguridadBolsa = selloSeguridadBolsa.toUpperCase();
    rem.pesoBrutoTotalG = Number(pesoBolsaG.toFixed(2));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remisiones));
    return rem;
  }
}

