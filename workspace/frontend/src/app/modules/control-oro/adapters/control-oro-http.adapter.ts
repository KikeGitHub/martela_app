import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BalanceOroResumen,
  ControlOroRepository,
  LoteOro,
} from '../ports/control-oro.repository';

/**
 * Adaptador HTTP de Producción (Fase 3 - Integración Fullstack).
 * Conecta con el backend Spring Boot sin alterar el componente ni la plantilla visual.
 */
@Injectable()
export class ControlOroHttpAdapter implements ControlOroRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/control-oro`;

  constructor(private readonly http: HttpClient) {}

  obtenerLotes(): Promise<LoteOro[]> {
    return firstValueFrom(this.http.get<LoteOro[]>(`${this.baseUrl}/lotes`));
  }

  registrarLote(
    lote: Omit<LoteOro, 'id' | 'pesoFinoGramos' | 'fechaRegistro'>
  ): Promise<LoteOro[]> & Promise<LoteOro> {
    return firstValueFrom(this.http.post<LoteOro>(`${this.baseUrl}/lotes`, lote)) as Promise<LoteOro> & Promise<LoteOro[]>;
  }

  calcularBalanceResumen(): Promise<BalanceOroResumen> {
    return firstValueFrom(this.http.get<BalanceOroResumen>(`${this.baseUrl}/balance`));
  }
}

