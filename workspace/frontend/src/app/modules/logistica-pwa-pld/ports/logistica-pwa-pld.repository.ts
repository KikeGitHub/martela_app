import { InjectionToken } from '@angular/core';

export interface EvidenciaEntregaPld {
  idEvidencia: number;
  idRemision: number;
  selloSeguridadVerificado: string;
  auditorEntrega: string;
  receptorNombre: string;
  firmaDigitalBase64: string;
  fotoComprobanteUrl: string;
  /** Coordenadas GPS (NUMERIC(10,8) y NUMERIC(11,8)) */
  latitud: number;
  longitud: number;
  fechaHora: string;
  estatusAuditoria: 'PENDIENTE' | 'VALIDADO';
}

export interface LogisticaPwaPldRepository {
  listarEvidenciasPld(): Promise<EvidenciaEntregaPld[]>;
  confirmarEntregaPld(
    payload: Omit<EvidenciaEntregaPld, 'idEvidencia' | 'fechaHora' | 'estatusAuditoria'>
  ): Promise<EvidenciaEntregaPld>;
  sincronizarColaOffline(): Promise<number>;
}

export const LOGISTICA_PWA_PLD_REPOSITORY = new InjectionToken<LogisticaPwaPldRepository>(
  'LOGISTICA_PWA_PLD_REPOSITORY'
);

