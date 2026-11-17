import { Component, Inject, OnInit } from '@angular/core';
import {
  BASCULA_ALMACEN_REPOSITORY,
  BasculaAlmacenRepository,
  SubPiezaInventarioIndividual,
  UbicacionGaveta,
} from './ports/bascula-almacen.repository';

@Component({
  selector: 'app-bascula-almacen',
  templateUrl: './bascula-almacen.component.html',
  styleUrls: ['./bascula-almacen.component.scss'],
})
export class BasculaAlmacenComponent implements OnInit {
  gavetas: UbicacionGaveta[] = [];
  sesionPesaje: SubPiezaInventarioIndividual[] = [];

  constructor(
    @Inject(BASCULA_ALMACEN_REPOSITORY)
    private readonly repository: BasculaAlmacenRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.gavetas = await this.repository.listarGavetas();
  }
}

