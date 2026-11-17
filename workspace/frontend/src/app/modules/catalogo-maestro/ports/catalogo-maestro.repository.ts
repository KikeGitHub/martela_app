import { InjectionToken } from '@angular/core';

export type MetalTipoMartela = 'ORO_10K' | 'ORO_14K' | 'ORO_18K' | 'PLATA_925';
export type PaisOrigenProveedor = 'CHINA' | 'HONG_KONG' | 'ITALIA' | 'TURQUIA' | 'MEXICO';
export type MonedaCompra = 'USD' | 'EUR' | 'MXN';

export interface ProveedorJoyeria {
  id: number;
  codigoInterno: string;
  razonSocial: string;
  paisOrigen: PaisOrigenProveedor;
  monedaCompra: MonedaCompra;
}

export interface ProductoSkuMaestro {
  /** SKU de 14 dígitos (EAN/GTIN-14) */
  sku: string;
  modeloMartela: string;
  modeloProveedor: string;
  idProveedor: number;
  proveedorNombre: string;
  paisOrigen: PaisOrigenProveedor;
  descripcion: string;
  tipoAlhaja: string;
  metalTipo: MetalTipoMartela;
  medida: string;
  costoMoBase: number;
  /** Peso de circonia (CZ) a descontar con precisión de 4 decimales (0.0000g a 1.1200g) */
  pesoPiedraCz: number;
  /** Factor Oro Fino generado: 0.58333 (14K), 0.41667 (10K), 0.00000 (Plata .925) */
  factorOroFino: number;
}

export interface CatalogoMaestroRepository {
  listarProveedores(): Promise<ProveedorJoyeria[]>;
  buscarProductos(query?: string): Promise<ProductoSkuMaestro[]>;
  guardarProducto(producto: Omit<ProductoSkuMaestro, 'factorOroFino'>): Promise<ProductoSkuMaestro>;
  importarMatrizCz(lote: Array<{ sku: string; pesoPiedraCz: number }>): Promise<number>;
}

export const CATALOGO_MAESTRO_REPOSITORY = new InjectionToken<CatalogoMaestroRepository>(
  'CATALOGO_MAESTRO_REPOSITORY'
);

