import { Component, Inject, OnInit } from '@angular/core';
import {
  CotizacionBipartitaDTO,
  MOTOR_FINANCIERO_FIX_REPOSITORY,
  MotorFinancieroFixRepository,
  TasaMetalFixDia,
} from './ports/motor-financiero-fix.repository';

@Component({
  selector: 'app-motor-financiero-fix',
  templateUrl: './motor-financiero-fix.component.html',
  styleUrls: ['./motor-financiero-fix.component.scss'],
})
export class MotorFinancieroFixComponent implements OnInit {
  tasas?: TasaMetalFixDia;
  cotizacion?: CotizacionBipartitaDTO;

  constructor(
    @Inject(MOTOR_FINANCIERO_FIX_REPOSITORY)
    private readonly repository: MotorFinancieroFixRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.tasas = await this.repository.obtenerTasasVigentes();
  }
}

