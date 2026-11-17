package com.martela.backend.domain.ports.out;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Puerto de salida (Hexagonal Architecture) para la persistencia de inventario de oro y joyería.
 * Los servicios de aplicación dependen de esta interfaz y nunca de JPA directamente.
 */
public interface InventarioOroRepositoryPort {

    /**
     * Registra un lote de oro o movimiento de fundición con precisión BigDecimal (escala 3 para gramos).
     */
    String registrarMovimientoOro(
            String tipoMateria,
            String quilataje,
            BigDecimal pesoBrutoGramos,
            BigDecimal pesoFinoGramos,
            BigDecimal mermaPermitidaGramos,
            BigDecimal costoPorGramoMxn
    );

    BigDecimal obtenerTotalPesoFinoGramos();

    Optional<BigDecimal> obtenerSpotFixProtegidoUsd();
}

