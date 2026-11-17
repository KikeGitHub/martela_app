import { Component, Inject, OnInit } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import {
  CATALOGO_MAESTRO_REPOSITORY,
  CatalogoMaestroRepository,
  ProductoSkuMaestro,
  ProveedorJoyeria,
} from './ports/catalogo-maestro.repository';

@Component({
  selector: 'app-catalogo-maestro',
  templateUrl: './catalogo-maestro.component.html',
  styleUrls: ['./catalogo-maestro.component.scss'],
})
export class CatalogoMaestroComponent implements OnInit {
  proveedores: ProveedorJoyeria[] = [];
  productos: ProductoSkuMaestro[] = [];
  private readonly searchSubject = new Subject<string>();

  constructor(
    @Inject(CATALOGO_MAESTRO_REPOSITORY)
    private readonly repository: CatalogoMaestroRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.proveedores = await this.repository.listarProveedores();
    this.productos = await this.repository.buscarProductos('');

    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(async (term) => {
      this.productos = await this.repository.buscarProductos(term);
    });
  }

  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }
}

