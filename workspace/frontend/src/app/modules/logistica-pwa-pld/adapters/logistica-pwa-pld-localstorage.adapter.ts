import { Injectable } from '@angular/core';
import {
  EvidenciaEntregaPld,
  LogisticaPwaPldRepository,
} from '../ports/logistica-pwa-pld.repository';

const STORAGE_KEY = 'martela_sdop_logistica_pwa_pld';
const OFFLINE_QUEUE_KEY = 'martela_sdop_pwa_offline_queue';

@Injectable()
export class LogisticaPwaPldLocalStorageAdapter implements LogisticaPwaPldRepository {
  async listarEvidenciasPld(): Promise<EvidenciaEntregaPld[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  async confirmarEntregaPld(
    payload: Omit<EvidenciaEntregaPld, 'idEvidencia' | 'fechaHora' | 'estatusAuditoria'>
  ): Promise<EvidenciaEntregaPld> {
    const items = await this.listarEvidenciasPld();
    const record: EvidenciaEntregaPld = {
      ...payload,
      idEvidencia: Date.now(),
      latitud: Number(payload.latitud.toFixed(8)),
      longitud: Number(payload.longitud.toFixed(8)),
      fechaHora: new Date().toISOString(),
      estatusAuditoria: navigator.onLine ? 'VALIDADO' : 'PENDIENTE',
    };
    items.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));

    if (!navigator.onLine) {
      const qRaw = localStorage.getItem(OFFLINE_QUEUE_KEY);
      const q: EvidenciaEntregaPld[] = qRaw ? JSON.parse(qRaw) : [];
      q.push(record);
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(q));
    }

    return record;
  }

  async sincronizarColaOffline(): Promise<number> {
    const qRaw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const q: EvidenciaEntregaPld[] = qRaw ? JSON.parse(qRaw) : [];
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
    return q.length;
  }
}

