import { Component, Inject, OnInit } from '@angular/core';
import {
  INVENTARIO_JOYAS_REPOSITORY,
  InventarioJoyasRepository,
  PiezaJoya,
} from './ports/inventario-joyas.repository';

@Component({
  selector: 'app-inventario-joyas',
  templateUrl: './inventario-joyas.component.html',
  styleUrls: ['./inventario-joyas.component.scss'],
})
export class InventarioJoyasComponent implements OnInit {
  piezas: PiezaJoya[] = [];

  constructor(
    @Inject(INVENTARIO_JOYAS_REPOSITORY)
    private readonly repository: InventarioJoyasRepository
  ) {}

  async ngOnInit(): Promise<void> {
    await this.cargarPiezas();
  }

  async cargarPiezas(filtroSku?: string): Promise<void> {
    this.piezas = await this.repository.listarPiezas(filtroSku);
  }
}

