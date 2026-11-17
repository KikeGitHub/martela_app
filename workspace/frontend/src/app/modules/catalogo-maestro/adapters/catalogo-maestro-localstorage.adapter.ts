import { Injectable } from '@angular/core';
import {
  CatalogoMaestroRepository,
  MetalTipoMartela,
  ProductoSkuMaestro,
  ProveedorJoyeria,
} from '../ports/catalogo-maestro.repository';

const STORAGE_KEY = 'martela_sdop_catalogo_maestro';

@Injectable()
export class CatalogoMaestroLocalStorageAdapter implements CatalogoMaestroRepository {
  private calcularFactorOroFino(metal: MetalTipoMartela): number {
    if (metal === 'ORO_14K') return 0.58333;
    if (metal === 'ORO_10K') return 0.41667;
    if (metal === 'ORO_18K') return 0.75;
    return 0.0;
  }

  async listarProveedores(): Promise<ProveedorJoyeria[]> {
    return [
      { id: 1, codigoInterno: 'PROV-CHN-01', razonSocial: 'Shenzhen Finefey Jewelry Co., Ltd.', paisOrigen: 'CHINA', monedaCompra: 'USD' },
      { id: 2, codigoInterno: 'PROV-HKG-02', razonSocial: 'HK Gracey Jewel International Ltd.', paisOrigen: 'HONG_KONG', monedaCompra: 'USD' },
      { id: 3, codigoInterno: 'PROV-ITA-03', razonSocial: 'Italoro Arezzo S.p.A.', paisOrigen: 'ITALIA', monedaCompra: 'EUR' },
      { id: 4, codigoInterno: 'PROV-TUR-04', razonSocial: 'Lotus Gold Kuyumculuk A.S.', paisOrigen: 'TURQUIA', monedaCompra: 'USD' },
      { id: 5, codigoInterno: 'PROV-TUR-05', razonSocial: 'Arpas Export Jewelry Istanbul', paisOrigen: 'TURQUIA', monedaCompra: 'USD' },
    ];
  }

  async buscarProductos(query = ''): Promise<ProductoSkuMaestro[]> {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: ProductoSkuMaestro[] = raw ? JSON.parse(raw) : [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.sku.toLowerCase().includes(q) ||
        i.modeloMartela.toLowerCase().includes(q) ||
        i.modeloProveedor.toLowerCase().includes(q) ||
        i.descripcion.toLowerCase().includes(q)
    );
  }

  async guardarProducto(
    input: Omit<ProductoSkuMaestro, 'factorOroFino'>
  ): Promise<ProductoSkuMaestro> {
    const items = await this.buscarProductos();
    const record: ProductoSkuMaestro = {
      ...input,
      pesoPiedraCz: Number(input.pesoPiedraCz.toFixed(4)),
      costoMoBase: Number(input.costoMoBase.toFixed(2)),
      factorOroFino: this.calcularFactorOroFino(input.metalTipo),
    };
    const idx = items.findIndex((x) => x.sku === record.sku);
    if (idx >= 0) items[idx] = record;
    else items.unshift(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return record;
  }

  async importarMatrizCz(lote: Array<{ sku: string; pesoPiedraCz: number }>): Promise<number> {
    const items = await this.buscarProductos();
    let count = 0;
    lote.forEach((row) => {
      const target = items.find((i) => i.sku === row.sku || i.modeloProveedor === row.sku);
      if (target) {
        target.pesoPiedraCz = Number(row.pesoPiedraCz.toFixed(4));
        count++;
      }
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return count;
  }
}

