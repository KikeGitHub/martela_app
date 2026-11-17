import { Component, Inject, OnInit } from '@angular/core';
import {
  BalanceOroResumen,
  CONTROL_ORO_REPOSITORY,
  ControlOroRepository,
  LoteOro,
} from './ports/control-oro.repository';

@Component({
  selector: 'app-control-oro',
  templateUrl: './control-oro.component.html',
  styleUrls: ['./control-oro.component.scss'],
})
export class ControlOroComponent implements OnInit {
  lotes: LoteOro[] = [];
  balance?: BalanceOroResumen;

  constructor(
    @Inject(CONTROL_ORO_REPOSITORY)
    private readonly repository: ControlOroRepository
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarDatos();
  }

  async cargarDatos(): Promise<void> {
    this.lotes = await this.repository.obtenerLotes();
    this.balance = await this.repository.calcularBalanceResumen();
  }
}

