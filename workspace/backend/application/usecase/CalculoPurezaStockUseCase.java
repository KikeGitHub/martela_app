package com.martela.backend.application.usecase;

import com.martela.backend.domain.ports.out.InventarioOroRepositoryPort;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

/**
 * Caso de uso de dominio para el cálculo de pureza de oro, peso fino (24k) y regla de protección FIX.
 */
public class CalculoPurezaStockUseCase {

    private static final Map<String, BigDecimal> FACTORES_QUILATAJE = Map.of(
            "24k", new BigDecimal("1.0000"),
            "18k", new BigDecimal("0.7500"),
            "14k", new BigDecimal("0.5833"),
            "10k", new BigDecimal("0.4167")
    );

    private final InventarioOroRepositoryPort repositoryPort;

    public CalculoPurezaStockUseCase(InventarioOroRepositoryPort repositoryPort) {
        this.repositoryPort = repositoryPort;
    }

    /**
     * Calcula el peso fino puro en gramos con escala decimal estricta de 3 decimales (0.000g).
     */
    public BigDecimal calcularPesoFino(BigDecimal pesoBrutoGramos, String quilataje) {
        BigDecimal factor = FACTORES_QUILATAJE.getOrDefault(quilataje.toLowerCase(), BigDecimal.ZERO);
        return pesoBrutoGramos.multiply(factor).setScale(3, RoundingMode.HALF_UP);
    }

    /**
     * Regla de Negocio Martela: Aplica el FIX más alto entre Hoy y Ayer para proteger el margen.
     */
    public BigDecimal calcularFixProtegido(BigDecimal fixHoyUsd, BigDecimal fixAyerUsd) {
        return fixHoyUsd.max(fixAyerUsd).setScale(2, RoundingMode.HALF_UP);
    }
}

