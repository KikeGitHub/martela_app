import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  DestinoSemaforoCalidad,
  InspeccionCalidadRow,
  RecepcionCalidadRepository,
  RecepcionPaqueteria,
} from '../ports/recepcion-calidad.repository';

@Injectable()
export class RecepcionCalidadHttpAdapter implements RecepcionCalidadRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/recepciones`;

  constructor(private readonly http: HttpClient) {}

  listarRecepciones(): Promise<RecepcionPaqueteria[]> {
    return firstValueFrom(this.http.get<RecepcionPaqueteria[]>(this.baseUrl));
  }

  registrarRecepcion(
    data: Omit<RecepcionPaqueteria, 'idRecepcion' | 'estatus' | 'fechaLlegada' | 'inspecciones'>
  ): Promise<RecepcionPaqueteria> {
    return firstValueFrom(this.http.post<RecepcionPaqueteria>(this.baseUrl, data));
  }

  incrementarSemaforo(
    idInspeccion: number,
    destino: DestinoSemaforoCalidad,
    delta = 1
  ): Promise<InspeccionCalidadRow> {
    return firstValueFrom(
      this.http.patch<InspeccionCalidadRow>(`${this.baseUrl}/inspecciones/${idInspeccion}/semaforo`, {
        destino,
        delta,
      })
    );
  }

  cerrarDictamenCalidad(idRecepcion: number): Promise<RecepcionPaqueteria> {
    return firstValueFrom(
      this.http.post<RecepcionPaqueteria>(`${this.baseUrl}/${idRecepcion}/conciliar`, {})
    );
  }
}

