import { Component, Inject, OnInit } from '@angular/core';
import {
  SALIDAS_B2B_REPOSITORY,
  SalidaRemisionB2b,
  SalidasB2bRepository,
} from './ports/salidas-b2b.repository';

@Component({
  selector: 'app-salidas-b2b',
  templateUrl: './salidas-b2b.component.html',
  styleUrls: ['./salidas-b2b.component.scss'],
})
export class SalidasB2bComponent implements OnInit {
  remisiones: SalidaRemisionB2b[] = [];

  constructor(
    @Inject(SALIDAS_B2B_REPOSITORY)
    private readonly repository: SalidasB2bRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.remisiones = await this.repository.listarRemisiones();
  }
}

