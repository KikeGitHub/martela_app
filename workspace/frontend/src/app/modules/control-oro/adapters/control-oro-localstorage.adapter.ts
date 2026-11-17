import { Injectable } from '@angular/core';
import {
  BalanceOroResumen,
  ControlOroRepository,
  LoteOro,
  QuilatajeOro,
} from '../ports/control-oro.repository';

const STORAGE_KEY = 'martela_sdop_control_oro';

const FACTORES_PUREZA: Record<QuilatajeOro, number> = {
  '24k': 1.0,
  '18k': 0.75,
  '14k': 0.5833,
  '10k': 0.4167,
};

/**
 * Adaptador Mock (Fase 0 - Demo) que persiste y lee datos en LocalStorage.
 */
@Injectable()
export class ControlOroLocalStorageAdapter implements ControlOroRepository {
  async obtenerLotes(): Promise<LoteOro[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LoteOro[]) : [];
  }

  async registrarLote(
    nuevo: Omit<LoteOro, 'id' | 'pesoFinoGramos' | 'fechaRegistro'>
  ): Promise<LoteOro> {
    const lotes = await this.obtenerLotes();
    const factor = FACTORES_PUREZA[nuevo.quilataje];
    const pesoBruto = Number(nuevo.pesoBrutoGramos.toFixed(3));
    const pesoFino = Number((pesoBruto * factor).toFixed(3));

    const registro: LoteOro = {
      ...nuevo,
      id: `ORO-${Date.now()}`,
      pesoBrutoGramos: pesoBruto,
      pesoFinoGramos: pesoFino,
      mermaPermitidaGramos: Number(nuevo.mermaPermitidaGramos.toFixed(3)),
      fechaRegistro: new Date().toISOString(),
    };

    lotes.push(registro);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lotes));
    return registro;
  }

  async calcularBalanceResumen(): Promise<BalanceOroResumen> {
    const lotes = await this.obtenerLotes();
    const totalPesoBrutoGramos = Number(
      lotes.reduce((acc, item) => acc + item.pesoBrutoGramos, 0).toFixed(3)
    );
    const totalPesoFinoGramos = Number(
      lotes.reduce((acc, item) => acc + item.pesoFinoGramos, 0).toFixed(3)
    );
    const valuacionTotalMxn = Number(
      lotes.reduce((acc, item) => acc + item.pesoBrutoGramos * item.costoPorGramoMxn, 0).toFixed(2)
    );

    return {
      totalPesoBrutoGramos,
      totalPesoFinoGramos,
      spotFixAplicadoUsd: 2680.0,
      valuacionTotalMxn,
    };
  }
}

