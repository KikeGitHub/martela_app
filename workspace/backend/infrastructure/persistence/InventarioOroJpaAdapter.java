package com.martela.backend.infrastructure.persistence;

import com.martela.backend.domain.ports.out.InventarioOroRepositoryPort;
import java.math.BigDecimal;
import java.util.Optional;

/**
 * Adaptador de persistencia JPA/JDBC que implementa el puerto de salida InventarioOroRepositoryPort.
 */
public class InventarioOroJpaAdapter implements InventarioOroRepositoryPort {

    @Override
    public String registrarMovimientoOro(
            String tipoMateria,
            String quilataje,
            BigDecimal pesoBrutoGramos,
            BigDecimal pesoFinoGramos,
            BigDecimal mermaPermitidaGramos,
            BigDecimal costoPorGramoMxn
    ) {
        // Implementación conectada a EntityManager / Spring Data JPA en Fase 3
        throw new UnsupportedOperationException("Pendiente de integración en Fase 3 según SDD aprobado");
    }

    @Override
    public BigDecimal obtenerTotalPesoFinoGramos() {
        return BigDecimal.ZERO.setScale(3);
    }

    @Override
    public Optional<BigDecimal> obtenerSpotFixProtegidoUsd() {
        return Optional.of(new BigDecimal("2680.00"));
    }
}

