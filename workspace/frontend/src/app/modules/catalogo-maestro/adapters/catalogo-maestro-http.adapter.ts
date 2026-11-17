import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CatalogoMaestroRepository,
  ProductoSkuMaestro,
  ProveedorJoyeria,
} from '../ports/catalogo-maestro.repository';

@Injectable()
export class CatalogoMaestroHttpAdapter implements CatalogoMaestroRepository {
  private readonly baseUrl = `${environment.apiBaseUrl}/productos`;

  constructor(private readonly http: HttpClient) {}

  listarProveedores(): Promise<ProveedorJoyeria[]> {
    return firstValueFrom(this.http.get<ProveedorJoyeria[]>(`${this.baseUrl}/proveedores`));
  }

  buscarProductos(query = ''): Promise<ProductoSkuMaestro[]> {
    const params = new HttpParams().set('query', query);
    return firstValueFrom(this.http.get<ProductoSkuMaestro[]>(`${this.baseUrl}/buscar`, { params }));
  }

  guardarProducto(producto: Omit<ProductoSkuMaestro, 'factorOroFino'>): Promise<ProductoSkuMaestro> {
    return firstValueFrom(this.http.post<ProductoSkuMaestro>(this.baseUrl, producto));
  }

  importarMatrizCz(lote: Array<{ sku: string; pesoPiedraCz: number }>): Promise<number> {
    return firstValueFrom(
      this.http.post<number>(`${this.baseUrl}/importar-catalogo-cz`, lote)
    );
  }
}

