import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  EstatusPiezaJoya,
  InventarioJoyasRepository,
  PiezaJoya,
} from '../ports/inventario-joyas.repository';

/**
 * Adaptador HTTP de Producción (Fase 3 - Integración Fullstack).
 * Conecta con el backend Spring Boot sin alterar el componente ni la plantilla visual.
 */
@Injectable()
export class InventarioJoyasHttpAdapter implements InventarioJoyasRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/inventario-joyas`;

  constructor(private readonly http: HttpClient) {}

  listarPiezas(filtroSku?: string): Promise<PiezaJoya[]> {
    const params = filtroSku ? new HttpParams().set('sku', filtroSku) : undefined;
    return firstValueFrom(this.http.get<PiezaJoya[]>(`${this.baseUrl}/piezas`, { params }));
  }

  registrarPieza(pieza: Omit<PiezaJoya, 'fechaIngreso'>): Promise<PiezaJoya> {
    return firstValueFrom(this.http.post<PiezaJoya>(`${this.baseUrl}/piezas`, pieza));
  }

  actualizarEstatus(serial: string, nuevoEstatus: EstatusPiezaJoya): Promise<PiezaJoya> {
    return firstValueFrom(
      this.http.patch<PiezaJoya>(`${this.baseUrl}/piezas/${encodeURIComponent(serial)}/estatus`, {
        estatus: nuevoEstatus,
      })
    );
  }
}

