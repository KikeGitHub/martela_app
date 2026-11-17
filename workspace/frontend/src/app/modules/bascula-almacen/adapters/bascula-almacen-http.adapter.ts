import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  BasculaAlmacenRepository,
  SubPiezaInventarioIndividual,
  UbicacionGaveta,
} from '../ports/bascula-almacen.repository';

@Injectable()
export class BasculaAlmacenHttpAdapter implements BasculaAlmacenRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/inventario`;

  constructor(private readonly http: HttpClient) {}

  listarGavetas(): Promise<UbicacionGaveta[]> {
    return firstValueFrom(this.http.get<UbicacionGaveta[]>(`${this.baseUrl}/gavetas`));
  }

  pesarSubPieza(payload: {
    skuRef: string;
    pesoBrutoG: number;
    pesoPiedraCzCatalogoG: number;
    factorOroFinoCatalogo: number;
    idUbicacion: number;
    codigoGaveta: string;
  }): Promise<SubPiezaInventarioIndividual> {
    return firstValueFrom(
      this.http.post<SubPiezaInventarioIndividual>(`${this.baseUrl}/pesar-pieza`, payload)
    );
  }

  obtenerExistenciasPorSku(sku: string): Promise<SubPiezaInventarioIndividual[]> {
    return firstValueFrom(
      this.http.get<SubPiezaInventarioIndividual[]>(
        `${this.baseUrl}/sku/${encodeURIComponent(sku)}/existencias`
      )
    );
  }
}

