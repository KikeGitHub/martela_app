import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CotizacionBipartitaDTO,
  MotorFinancieroFixRepository,
  TasaMetalFixDia,
} from '../ports/motor-financiero-fix.repository';

@Injectable()
export class MotorFinancieroFixHttpAdapter implements MotorFinancieroFixRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/finanzas-metales`;

  constructor(private readonly http: HttpClient) {}

  obtenerTasasVigentes(): Promise<TasaMetalFixDia[]> & Promise<TasaMetalFixDia> {
    return firstValueFrom(this.http.get<TasaMetalFixDia>(`${this.baseUrl}/tasas-fix`)) as Promise<TasaMetalFixDia> & Promise<TasaMetalFixDia[]>;
  }

  calcularLiquidacionBipartita(params: {
    idPieza: string;
    pesoNetoMetalG: number;
    costoMoGramos: number;
    metalTipo: 'ORO_10K' | 'ORO_14K' | 'PLATA_925';
  }): Promise<CotizacionBipartitaDTO> {
    return firstValueFrom(
      this.http.post<CotizacionBipartitaDTO>(`${this.baseUrl}/calcular-costo`, params)
    );
  }
}

