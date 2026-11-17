import { Component, Inject, OnInit } from '@angular/core';
import {
  EvidenciaEntregaPld,
  LOGISTICA_PWA_PLD_REPOSITORY,
  LogisticaPwaPldRepository,
} from './ports/logistica-pwa-pld.repository';

@Component({
  selector: 'app-logistica-pwa-pld',
  templateUrl: './logistica-pwa-pld.component.html',
  styleUrls: ['./logistica-pwa-pld.component.scss'],
})
export class LogisticaPwaPldComponent implements OnInit {
  evidencias: EvidenciaEntregaPld[] = [];

  constructor(
    @Inject(LOGISTICA_PWA_PLD_REPOSITORY)
    private readonly repository: LogisticaPwaPldRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.evidencias = await this.repository.listarEvidenciasPld();
  }
}

