import { Injectable } from '@angular/core';
import {
  CotizacionBipartitaDTO,
  MotorFinancieroFixRepository,
  TasaMetalFixDia,
} from '../ports/motor-financiero-fix.repository';

@Injectable()
export class MotorFinancieroFixLocalStorageAdapter implements MotorFinancieroFixRepository {
  async obtenerTasasVigentes(): Promise<TasaMetalFixDia> {
    const fixHoy = 2650.0;
    const fixAyer = 2680.0;
    const fixAplicado = Math.max(fixHoy, fixAyer);
    const tc = 19.5;
    const gramo24k = (fixAplicado * tc) / 31.1035;

    return {
      fecha: new Date().toISOString().slice(0, 10),
      fixOroHoyUsd: fixHoy,
      fixOroAyerUsd: fixAyer,
      fixAplicado,
      tipoCambioUsdMxn: tc,
      costoGramo10kMxn: Number((gramo24k * 0.41667).toFixed(2)),
      costoGramo14kMxn: Number((gramo24k * 0.58333).toFixed(2)),
      costoGramoPlataMxn: 24.8,
    };
  }

  async calcularLiquidacionBipartita(params: {
    idPieza: string;
    pesoNetoMetalG: number;
    costoMoGramos: number;
    metalTipo: 'ORO_10K' | 'ORO_14K' | 'PLATA_925';
  }): Promise<CotizacionBipartitaDTO> {
    const tasas = await this.obtenerTasasVigentes();
    const factor =
      params.metalTipo === 'ORO_14K' ? 0.58333 : params.metalTipo === 'ORO_10K' ? 0.41667 : 0.0;
    const costoGramoMetal =
      params.metalTipo === 'ORO_14K'
        ? tasas.costoGramo14kMxn
        : params.metalTipo === 'ORO_10K'
        ? tasas.costoGramo10kMxn
        : tasas.costoGramoPlataMxn;

    const costoManoObra = Number((params.pesoNetoMetalG * params.costoMoGramos).toFixed(2));
    const costoMetal = Number((params.pesoNetoMetalG * costoGramoMetal).toFixed(2));
    const subtotalMartela = Number((costoManoObra + costoMetal).toFixed(2));
    const margenCliente70 = Number((subtotalMartela * 0.7).toFixed(2));
    const iva16 = Number(((subtotalMartela + margenCliente70) * 0.16).toFixed(2));
    const precioPublicoConIva = Number((subtotalMartela + margenCliente70 + iva16).toFixed(2));
    const gramosOroFinoDebitar = Number((params.pesoNetoMetalG * factor).toFixed(5));

    return {
      idPieza: params.idPieza,
      pesoNetoMetalG: Number(params.pesoNetoMetalG.toFixed(4)),
      costoManoObra,
      costoMetal,
      subtotalMartela,
      margenCliente70,
      iva16,
      precioPublicoConIva,
      gramosOroFinoDebitar,
    };
  }
}

