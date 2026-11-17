import { Component, Inject, OnInit } from '@angular/core';
import {
  DestinoSemaforoCalidad,
  RECEPCION_CALIDAD_REPOSITORY,
  RecepcionCalidadRepository,
  RecepcionPaqueteria,
} from './ports/recepcion-calidad.repository';

@Component({
  selector: 'app-recepcion-calidad',
  templateUrl: './recepcion-calidad.component.html',
  styleUrls: ['./recepcion-calidad.component.scss'],
})
export class RecepcionCalidadComponent implements OnInit {
  recepciones: RecepcionPaqueteria[] = [];
  pasoWizard: 1 | 2 = 1;

  constructor(
    @Inject(RECEPCION_CALIDAD_REPOSITORY)
    private readonly repository: RecepcionCalidadRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.recepciones = await this.repository.listarRecepciones();
  }

  async clasificarPieza(idInspeccion: number, destino: DestinoSemaforoCalidad): Promise<void> {
    await this.repository.incrementarSemaforo(idInspeccion, destino, 1);
    this.recepciones = await this.repository.listarRecepciones();
  }
}

