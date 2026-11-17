import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  RenglonLayoutOficial16Columnas,
  SalidaRemisionB2b,
  SalidasB2bRepository,
} from '../ports/salidas-b2b.repository';

@Injectable()
export class SalidasB2bHttpAdapter implements SalidasB2bRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/salidas`;

  constructor(private readonly http: HttpClient) {}

  listarRemisiones(): Promise<SalidaRemisionB2b[]> {
    return firstValueFrom(this.http.get<SalidaRemisionB2b[]>(this.baseUrl));
  }

  generarLayoutOficial16Columnas(idRemision: number): Promise<RenglonLayoutOficial16Columnas[]> {
    return firstValueFrom(
      this.http.get<RenglonLayoutOficial16Columnas[]>(`${this.baseUrl}/${idRemision}/exportar-layout`)
    );
  }

  registrarSelloBolsa(
    idRemision: number,
    selloSeguridadBolsa: string,
    pesoBolsaG: number
  ): Promise<SalidaRemisionB2b> {
    return firstValueFrom(
      this.http.patch<SalidaRemisionB2b>(`${this.baseUrl}/${idRemision}/sello`, {
        selloSeguridadBolsa,
        pesoBolsaG,
      })
    );
  }
}

