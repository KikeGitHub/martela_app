import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EvidenciaEntregaPld,
  LogisticaPwaPldRepository,
} from '../ports/logistica-pwa-pld.repository';

@Injectable()
export class LogisticaPwaPldHttpAdapter implements LogisticaPwaPldRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/logistica`;

  constructor(private readonly http: HttpClient) {}

  listarEvidenciasPld(): Promise<EvidenciaEntregaPld[]> {
    return firstValueFrom(this.http.get<EvidenciaEntregaPld[]>(`${this.baseUrl}/evidencias-pld`));
  }

  confirmarEntregaPld(
    payload: Omit<EvidenciaEntregaPld, 'idEvidencia' | 'fechaHora' | 'estatusAuditoria'>
  ): Promise<EvidenciaEntregaPld> {
    return firstValueFrom(
      this.http.post<EvidenciaEntregaPld>(`${this.baseUrl}/confirmar-entrega`, payload)
    );
  }

  sincronizarColaOffline(): Promise<number> {
    return Promise.resolve(0);
  }
}

