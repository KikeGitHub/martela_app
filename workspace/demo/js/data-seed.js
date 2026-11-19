/**
 * MARTELA — Semilla de Datos Iniciales (Demo PoC · Arquitectura SDOP 6 Módulos Core)
 * Incluye:
 * 1. Catálogo Maestro Multi-Proveedor (+30 proveedores ref) y Matriz de Circonias (CZ a 4 decimales) + SKU 14 dígitos
 * 2. Recepciones de Paquetería (FedEx/Cometra) con Video-Evidencia y Mesa de Control de Calidad
 * 3. Báscula Digital, Pesaje Individual de Sub-piezas (4 decimales) y Almacén por Gavetas (Almacén->Rack->Nivel->Gaveta)
 * 4. Motor Financiero Fix, Oro Fino Puro (5 decimales) y Facturación Bipartita (M.O. + Metal + Margen 70% + IVA 16%)
 * 5. Salidas B2B (MLS Cancún/Santa Fe/Ecatepec/Texcoco & Coppel 26 tiendas), Layouts Excel 16 columnas y Remisiones con Sello
 * 6. Logística PWA Móvil (375px-430px), Validación de Sello de Seguridad, Firma Táctil Canvas, GPS y Expediente PLD
 */
window.MartelaSeed = (function() {
  // =========================================================================
  // MÓDULO 1: PROVEEDORES INTERNACIONALES Y NACIONALES
  // =========================================================================
  const proveedores = [
    { id: 1, codigo_interno: "PROV-CHN-01", razon_social: "Shenzhen Finefey Jewelry Co., Ltd.", pais_origen: "CHINA", moneda_compra: "USD", moneda_defecto: "USD", factor_merma_oro: 1.50, ciudad: "Shenzhen", lead_time_dias: 90 },
    { id: 2, codigo_interno: "PROV-HKG-02", razon_social: "HK Gracey Jewel International Ltd.", pais_origen: "CHINA", moneda_compra: "USD", moneda_defecto: "USD", factor_merma_oro: 1.50, ciudad: "Hong Kong", lead_time_dias: 75 },
    { id: 3, codigo_interno: "PROV-ITA-03", razon_social: "Italoro Arezzo S.p.A.", pais_origen: "ITALIA", moneda_compra: "EUR", moneda_defecto: "EUR", factor_merma_oro: 1.20, ciudad: "Arezzo", lead_time_dias: 60 },
    { id: 4, codigo_interno: "PROV-TUR-04", razon_social: "Lotus Gold Kuyumculuk A.S.", pais_origen: "TURQUIA", moneda_compra: "USD", moneda_defecto: "USD", factor_merma_oro: 1.50, ciudad: "Estambul", lead_time_dias: 65 },
    { id: 5, codigo_interno: "PROV-TUR-05", razon_social: "Arpas Export Jewelry Istanbul", pais_origen: "TURQUIA", moneda_compra: "USD", moneda_defecto: "USD", factor_merma_oro: 1.40, ciudad: "Estambul", lead_time_dias: 70 },
    { id: 6, codigo_interno: "PROV-MEX-06", razon_social: "Orfebres Finos de Guadalajara S.A.", pais_origen: "MEXICO", moneda_compra: "MXN", moneda_defecto: "MXN", factor_merma_oro: 2.00, ciudad: "Guadalajara", lead_time_dias: 15 },
    { id: 7, codigo_interno: "PROV-MEX-07", razon_social: "Platería Artesanal Taxco Real", pais_origen: "MEXICO", moneda_compra: "MXN", moneda_defecto: "MXN", factor_merma_oro: 2.50, ciudad: "Taxco", lead_time_dias: 12 }
  ];

  // =========================================================================
  // MÓDULO 1: CATÁLOGO MAESTRO DE SKUs (14 DÍGITOS) Y MATRIZ DE CIRCONIAS (CZ)
  // =========================================================================
  const products_sku = [
    {
      sku: "ANILLO-SOL-10K",
      sku_14: "07502278209688",
      modelo_martela: "MRT-AN-1042",
      modelo_proveedor: "FF-8821-CZ",
      id_proveedor: 1,
      proveedor_nombre: "Shenzhen Finefey Jewelry Co., Ltd.",
      pais_origen: "CHINA",
      descripcion: "Anillo Solitario Imperial con Circonia Suiza Oro 10K",
      tipo_alhaja: "ANILLO",
      categoria: "Anillos",
      metal_tipo: "ORO_10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      medida: "No. 7",
      costo_mo_base: 185.00,
      costo_hechura_base: 185.00,
      peso_piedra_cz: 0.1800,
      factor_oro_fino: 0.41667,
      es_campeon: true,
      stock_minimo: 50,
      lead_time_dias: 90,
      activo: true
    },
    {
      sku: "ESCLAVA-ORO-14K",
      sku_14: "07502278209695",
      modelo_martela: "MRT-ES-2018",
      modelo_proveedor: "ITL-ARZ-552",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      descripcion: "Esclava Clásica Tejido Cubano Diamantado 14K",
      tipo_alhaja: "ESCLAVA",
      categoria: "Esclavas",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      medida: "20 cm",
      costo_mo_base: 260.00,
      costo_hechura_base: 260.00,
      peso_piedra_cz: 0.0000,
      factor_oro_fino: 0.58333,
      es_campeon: true,
      stock_minimo: 40,
      lead_time_dias: 60,
      activo: true
    },
    {
      sku: "CADENA-ROLO-10K",
      sku_14: "07502278209701",
      modelo_martela: "MRT-CD-1105",
      modelo_proveedor: "ITL-ROL-10K",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      descripcion: "Cadena Rolo Eslabón Italiano Diamantado 10K",
      tipo_alhaja: "CADENA",
      categoria: "Cadenas",
      metal_tipo: "ORO_10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      medida: "50 cm",
      costo_mo_base: 220.00,
      costo_hechura_base: 220.00,
      peso_piedra_cz: 0.0000,
      factor_oro_fino: 0.41667,
      es_campeon: true,
      stock_minimo: 45,
      lead_time_dias: 60,
      activo: true
    },
    {
      sku: "ARETE-ARO-14K",
      sku_14: "07502278209718",
      modelo_martela: "MRT-AR-3090",
      modelo_proveedor: "GRC-HK-104",
      id_proveedor: 2,
      proveedor_nombre: "HK Gracey Jewel International Ltd.",
      pais_origen: "CHINA",
      descripcion: "Arete Arrancada Pavé con Micro-Circonias 14K",
      tipo_alhaja: "ARETE",
      categoria: "Aretes",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      medida: "22 mm",
      costo_mo_base: 195.00,
      costo_hechura_base: 195.00,
      peso_piedra_cz: 0.3400,
      factor_oro_fino: 0.58333,
      es_campeon: false,
      stock_minimo: 30,
      lead_time_dias: 75,
      activo: true
    },
    {
      sku: "DIJE-CORAZON-10K",
      sku_14: "07502278209725",
      modelo_martela: "MRT-DJ-4012",
      modelo_proveedor: "FF-9910-HRT",
      id_proveedor: 1,
      proveedor_nombre: "Shenzhen Finefey Jewelry Co., Ltd.",
      pais_origen: "CHINA",
      descripcion: "Dije Corazón Biselado con Circonia Central 10K",
      tipo_alhaja: "DIJE",
      categoria: "Dijes",
      metal_tipo: "ORO_10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      medida: "15 mm",
      costo_mo_base: 145.00,
      costo_hechura_base: 145.00,
      peso_piedra_cz: 0.0850,
      factor_oro_fino: 0.41667,
      es_campeon: false,
      stock_minimo: 35,
      lead_time_dias: 90,
      activo: true
    },
    {
      sku: "ANILLO-SELLO-14K",
      sku_14: "07502278209732",
      modelo_martela: "MRT-AN-5020",
      modelo_proveedor: "LTS-TR-901",
      id_proveedor: 4,
      proveedor_nombre: "Lotus Gold Kuyumculuk A.S.",
      pais_origen: "TURQUIA",
      descripcion: "Anillo Sello Imperial con Ónix y Circonias Laterales 14K",
      tipo_alhaja: "ANILLO",
      categoria: "Anillos",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      medida: "No. 9",
      costo_mo_base: 320.00,
      costo_hechura_base: 320.00,
      peso_piedra_cz: 0.6500,
      factor_oro_fino: 0.58333,
      es_campeon: false,
      stock_minimo: 25,
      lead_time_dias: 65,
      activo: true
    },
    {
      sku: "PULSERA-ESLABON-18K",
      sku_14: "07502278209749",
      modelo_martela: "MRT-PL-6011",
      modelo_proveedor: "ARP-14K-302",
      id_proveedor: 5,
      proveedor_nombre: "Arpas Export Jewelry Istanbul",
      pais_origen: "TURQUIA",
      descripcion: "Pulsera Rivière con Galería de Circonias 14K",
      tipo_alhaja: "PULSERA",
      categoria: "Pulseras",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      medida: "18.5 cm",
      costo_mo_base: 380.00,
      costo_hechura_base: 380.00,
      peso_piedra_cz: 1.1200,
      factor_oro_fino: 0.58333,
      es_campeon: true,
      stock_minimo: 20,
      lead_time_dias: 70,
      activo: true
    },
    {
      sku: "CADENA-FIGARO-14K",
      sku_14: "07502278209756",
      modelo_martela: "MRT-CD-2204",
      modelo_proveedor: "ITL-FIG-3X1",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      descripcion: "Cadena Fígaro 3x1 Diamantada Italiana 14K",
      tipo_alhaja: "CADENA",
      categoria: "Cadenas",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      medida: "55 cm",
      costo_mo_base: 290.00,
      costo_hechura_base: 290.00,
      peso_piedra_cz: 0.0000,
      factor_oro_fino: 0.58333,
      es_campeon: false,
      stock_minimo: 30,
      lead_time_dias: 60,
      activo: true
    },
    {
      sku: "CRUZ-LISA-10K",
      sku_14: "07502278209763",
      modelo_martela: "MRT-CR-1088",
      modelo_proveedor: "GRC-CRZ-019",
      id_proveedor: 2,
      proveedor_nombre: "HK Gracey Jewel International Ltd.",
      pais_origen: "CHINA",
      descripcion: "Dije Cruz Tradicional con Micro-Circonias 10K",
      tipo_alhaja: "DIJE",
      categoria: "Dijes",
      metal_tipo: "ORO_10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      medida: "24 mm",
      costo_mo_base: 135.00,
      costo_hechura_base: 135.00,
      peso_piedra_cz: 0.1200,
      factor_oro_fino: 0.41667,
      es_campeon: false,
      stock_minimo: 40,
      lead_time_dias: 75,
      activo: true
    },
    {
      sku: "MEDALLA-OVAL-14K",
      sku_14: "07502278209770",
      modelo_martela: "MRT-MD-1402",
      modelo_proveedor: "ORF-GDL-088",
      id_proveedor: 6,
      proveedor_nombre: "Orfebres Finos de Guadalajara S.A.",
      pais_origen: "MEXICO",
      descripcion: "Medalla Ovalada Bautizo Bisel Diamantado 14K",
      tipo_alhaja: "MEDALLA",
      categoria: "Medallas",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "14K",
      medida: "18 mm",
      costo_mo_base: 175.00,
      costo_hechura_base: 175.00,
      peso_piedra_cz: 0.0450,
      factor_oro_fino: 0.58333,
      es_campeon: false,
      stock_minimo: 25,
      lead_time_dias: 15,
      activo: true
    },
    {
      sku: "ANILLO-TRIO-18K",
      sku_14: "07502278209787",
      modelo_martela: "MRT-AN-7099",
      modelo_proveedor: "LTS-TRI-774",
      id_proveedor: 4,
      proveedor_nombre: "Lotus Gold Kuyumculuk A.S.",
      pais_origen: "TURQUIA",
      descripcion: "Anillo Trío Tres Oros con Halo de Circonia 14K",
      tipo_alhaja: "ANILLO",
      categoria: "Anillos",
      metal_tipo: "ORO_14K",
      tipo_metal: "ORO_TRICOLOR",
      quilataje: "14K",
      medida: "No. 6.5",
      costo_mo_base: 410.00,
      costo_hechura_base: 410.00,
      peso_piedra_cz: 0.2900,
      factor_oro_fino: 0.58333,
      es_campeon: true,
      stock_minimo: 15,
      lead_time_dias: 65,
      activo: true
    },
    {
      sku: "CADENA-ITALIANA-10K",
      sku_14: "07502278209794",
      modelo_martela: "MRT-CD-1095",
      modelo_proveedor: "ITL-PLM-10K",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      descripcion: "Cadena Italiana Tejido Palma Espejo 10K",
      tipo_alhaja: "CADENA",
      categoria: "Cadenas",
      metal_tipo: "ORO_10K",
      tipo_metal: "ORO_AMARILLO",
      quilataje: "10K",
      medida: "45 cm",
      costo_mo_base: 200.00,
      costo_hechura_base: 200.00,
      peso_piedra_cz: 0.0000,
      factor_oro_fino: 0.41667,
      es_campeon: false,
      stock_minimo: 35,
      lead_time_dias: 60,
      activo: true
    },
    {
      sku: "PULSERA-PLATA-925",
      sku_14: "07502278209901",
      modelo_martela: "MRT-AG-9250",
      modelo_proveedor: "TAX-AG-440",
      id_proveedor: 7,
      proveedor_nombre: "Platería Artesanal Taxco Real",
      pais_origen: "MEXICO",
      descripcion: "Pulsera Eslabón Torzal Plata Ley .925 con Circonia (Línea Cancún/Santa Fe)",
      tipo_alhaja: "PULSERA",
      categoria: "Plata .925",
      metal_tipo: "PLATA_925",
      tipo_metal: "PLATA_925",
      quilataje: "PLATA_925",
      medida: "19 cm",
      costo_mo_base: 45.00,
      costo_hechura_base: 45.00,
      peso_piedra_cz: 0.2200,
      factor_oro_fino: 0.00000,
      es_campeon: true,
      stock_minimo: 30,
      lead_time_dias: 12,
      activo: true
    }
  ];

  const proveedor_modelo_equivalencia = products_sku.map((p, idx) => ({
    id: idx + 1,
    id_proveedor: p.id_proveedor,
    proveedor_nombre: p.proveedor_nombre,
    pais_origen: p.pais_origen,
    sku_martela: p.sku,
    sku_14: p.sku_14,
    modelo_martela: p.modelo_martela,
    modelo_proveedor: p.modelo_proveedor,
    descripcion_proveedor: `${p.modelo_proveedor} · ${p.descripcion}`
  }));

  // =========================================================================
  // MÓDULO 2: RECEPCIONES DE PAQUETERÍA CON VIDEO-EVIDENCIA Y CONTROL DE CALIDAD
  // =========================================================================
  const recepciones_paqueteria = [
    {
      id_recepcion: 101,
      folio_recepcion: "REC-2026-0101",
      paqueteria: "FedEx International Priority",
      guia_tracking: "FDX-7894512039-HK",
      id_proveedor: 1,
      proveedor_nombre: "Shenzhen Finefey Jewelry Co., Ltd.",
      pais_origen: "CHINA",
      total_bultos: 4,
      peso_bruto_paquete_g: 2840.50,
      url_video_evidencia: "https://storage.martela.mx/evidencias/2026-10/unboxing-FDX-7894512039-cam01.mp4",
      responsable_recepcion: "David Morales (Almacén y Control)",
      estatus: "EN_REVISION",
      observaciones: "Sellos aduanales verificados bajo cámara cenital #1. 2 piezas con reasa abierta y 1 pieza fracturada para fundición.",
      fecha_llegada: "2026-10-17 08:15:00"
    },
    {
      id_recepcion: 102,
      folio_recepcion: "REC-2026-0102",
      paqueteria: "Cometra traslado de valores",
      guia_tracking: "COM-BLIND-9920184",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      total_bultos: 2,
      peso_bruto_paquete_g: 1620.00,
      url_video_evidencia: "https://storage.martela.mx/evidencias/2026-10/unboxing-COM-9920184-cam02.mp4",
      responsable_recepcion: "David Morales (Almacén y Control)",
      estatus: "CONCILIADO",
      observaciones: "Lote de cadenas italianas 10K y 14K conciliado al 100% sin faltantes.",
      fecha_llegada: "2026-10-15 10:40:00"
    }
  ];

  const inspecciones_calidad = [
    {
      id_inspeccion: 1,
      id_recepcion: 101,
      sku: "ANILLO-SOL-10K",
      sku_14: "07502278209688",
      modelo_martela: "MRT-AN-1042",
      descripcion: "Anillo Solitario Imperial con Circonia Suiza Oro 10K",
      piezas_recibidas: 50,
      piezas_aprobadas: 47,
      piezas_reparacion_interna: 2,
      piezas_merma_fundicion: 1,
      observaciones_tecnicas: "2 anillos con circonia lateral floja (enviados a Taller Reparación Interna); 1 aro aplastado (Charola Fundición)."
    },
    {
      id_inspeccion: 2,
      id_recepcion: 101,
      sku: "DIJE-CORAZON-10K",
      sku_14: "07502278209725",
      modelo_martela: "MRT-DJ-4012",
      descripcion: "Dije Corazón Biselado con Circonia Central 10K",
      piezas_recibidas: 40,
      piezas_aprobadas: 39,
      piezas_reparacion_interna: 1,
      piezas_merma_fundicion: 0,
      observaciones_tecnicas: "1 pieza con reasa abierta, pasa a ajuste rápido en taller interno."
    },
    {
      id_inspeccion: 3,
      id_recepcion: 101,
      sku: "ARETE-ARO-14K",
      sku_14: "07502278209718",
      modelo_martela: "MRT-AR-3090",
      descripcion: "Arete Arrancada Pavé con Micro-Circonias 14K",
      piezas_recibidas: 30,
      piezas_aprobadas: 30,
      piezas_reparacion_interna: 0,
      piezas_merma_fundicion: 0,
      observaciones_tecnicas: "Lote impecable, pasa directo a Mesa de Báscula."
    },
    {
      id_inspeccion: 4,
      id_recepcion: 102,
      sku: "ESCLAVA-ORO-14K",
      sku_14: "07502278209695",
      modelo_martela: "MRT-ES-2018",
      descripcion: "Esclava Clásica Tejido Cubano Diamantado 14K",
      piezas_recibidas: 35,
      piezas_aprobadas: 35,
      piezas_reparacion_interna: 0,
      piezas_merma_fundicion: 0,
      observaciones_tecnicas: "Broches verificados, 100% aprobadas."
    }
  ];

  // =========================================================================
  // MÓDULO 3: UBICACIONES FÍSICAS POR GAVETAS (ALMACÉN -> RACK -> NIVEL -> GAVETA)
  // =========================================================================
  const ubicaciones_gavetas = [
    { id_ubicacion: 1, almacen: "BOVEDA_ORO", rack: "R1", nivel: "N1", gaveta: "G01", codigo_completo: "BOVEDA-R1-N1-G01", descripcion: "Bóveda Principal · Anillos 10K Campeones" },
    { id_ubicacion: 2, almacen: "BOVEDA_ORO", rack: "R1", nivel: "N2", gaveta: "G05", codigo_completo: "BOVEDA-R1-N2-G05", descripcion: "Bóveda Principal · Esclavas y Pulseras 14K" },
    { id_ubicacion: 3, almacen: "BOVEDA_ORO", rack: "R2", nivel: "N1", gaveta: "G03", codigo_completo: "BOVEDA-R2-N1-G03", descripcion: "Bóveda Principal · Cadenas Italianas 10K/14K" },
    { id_ubicacion: 4, almacen: "BOVEDA_ORO", rack: "R2", nivel: "N3", gaveta: "G08", codigo_completo: "BOVEDA-R2-N3-G08", descripcion: "Bóveda Principal · Aretes, Dijes y Medallas" },
    { id_ubicacion: 5, almacen: "RACK_PLATA", rack: "R1", nivel: "N1", gaveta: "G02", codigo_completo: "RACK_PLATA-R1-N1-G02", descripcion: "Rack Plata .925 · Línea Cancún y Santa Fe" },
    { id_ubicacion: 6, almacen: "TAPANCO_FANTASIA", rack: "R2", nivel: "N1", gaveta: "G12", codigo_completo: "TAPANCO-R2-N1-G12", descripcion: "Tapanco · Empaque y Estuches B2B" },
    { id_ubicacion: 7, almacen: "DEFECTOS", rack: "R1", nivel: "N1", gaveta: "G01", codigo_completo: "DEFECTOS-R1-N1-G01", descripcion: "Charola de Pedacería para Fundición / Taller" }
  ];

  const warehouses = [
    { id: "BOVEDA_GENERAL", nombre: "Bóveda General (Gavetas Oro)", tipo: "Seguridad Alta" },
    { id: "RACK_PLATA", nombre: "Rack Plata .925 (Cancún/Sta Fe)", tipo: "Almacén Plata" },
    { id: "ALMACEN_COPPEL", nombre: "Mesa Despiece B2B (MLS/Coppel)", tipo: "Picking B2B" },
    { id: "SUCURSAL_CDMX", nombre: "Sucursal Santa Fe Avant", tipo: "Exhibición / Mostrador" },
    { id: "SUCURSAL_MERIDA", nombre: "Sucursal Cancún / Mérida", tipo: "Exhibición / Mostrador" },
    { id: "TALLER_FUNDICION", nombre: "Taller de Fundición y Reparación", tipo: "Procesamiento y Mermas" }
  ];

  // =========================================================================
  // MÓDULO 4: TASAS METAL FIX, ORO FINO PURO Y PARÁMETROS BIPARTITOS
  // =========================================================================
  const metal_rates = {
    fecha_hoy: "2026-10-17",
    fix_oro_hoy_usd: 2650.00,
    fix_oro_ayer_usd: 2680.00,
    tipo_cambio_usd_mxn: 19.5000,
    costo_gramo_plata_mxn: 24.80,
    margen_comercial_mls: 0.70, // 70% margen comercial cliente (MLS / Cancún / Santa Fe)
    iva_tasa: 0.16,             // 16% IVA
    regla_aplicada: "MAYOR_VALOR",
    coeficientes: {
      "10K": 0.41667,
      "14K": 0.58333,
      "18K": 0.75000,
      "22K": 0.91667,
      "PLATA_925": 0.00000
    }
  };

  // =========================================================================
  // CLIENTES Y CENTROS LOGÍSTICOS (MLS + COPPEL)
  // =========================================================================
  const clients = [
    {
      id: "CLI-001",
      nombre: "Coppel S.A. de C.V.",
      razon_social: "COPPEL S.A. DE C.V.",
      rfc: "COP920428Q20",
      regimen_fiscal: "601",
      regimen_desc: "General de Ley Personas Morales",
      cp_fiscal: "80000",
      uso_cfdi: "G01",
      uso_cfdi_desc: "Adquisición de mercancías",
      correo_facturacion: "facturacion.proveedores@coppel.com",
      condicion_pago: "30 días",
      dias_credito: 30,
      limite_credito: 5000000.00,
      metodo_pago_defecto: "PPD",
      forma_pago_defecto: "99",
      contacto: "Gerencia de Compras Joyería",
      cedis_principal: "CEDIS Iztapalapa",
      sucursales_activas: 26,
      saldo_oro_fino_g: 0.00000
    },
    {
      id: "CLI-004",
      nombre: "Montepío Luz Saviñón / Clientes Maquila",
      razon_social: "MONTEPÍO LUZ SAVIÑÓN I.A.P.",
      rfc: "MLS020815AA1",
      regimen_fiscal: "603",
      regimen_desc: "Personas Morales con Fines no Lucrativos",
      cp_fiscal: "06010",
      uso_cfdi: "G03",
      uso_cfdi_desc: "Gastos en general",
      correo_facturacion: "tesoreria.metales@montepioluzsavinon.org.mx",
      condicion_pago: "Liquidación Bipartita + Cuenta Oro Fino",
      dias_credito: 15,
      limite_credito: 3500000.00,
      metodo_pago_defecto: "PUE",
      forma_pago_defecto: "17",
      contacto: "Ing. Jorge Villaseñor / Compras Retail",
      sucursales_activas: 18,
      saldo_oro_fino_g: 145.80000 // Gramos de oro fino 24K a favor en cuenta maquila
    },
    {
      id: "CLI-002",
      nombre: "Joyas del Centro Mayoristas",
      razon_social: "JOYAS DEL CENTRO MAYORISTAS S.A. DE C.V.",
      rfc: "JCE850201BB2",
      regimen_fiscal: "601",
      regimen_desc: "General de Ley Personas Morales",
      cp_fiscal: "06000",
      uso_cfdi: "G01",
      uso_cfdi_desc: "Adquisición de mercancías",
      correo_facturacion: "pagos@joyasdelcentro.com.mx",
      condicion_pago: "Contado",
      dias_credito: 0,
      limite_credito: 500000.00,
      metodo_pago_defecto: "PUE",
      forma_pago_defecto: "03",
      contacto: "Lic. Fernando Robles",
      sucursales_activas: 1,
      saldo_oro_fino_g: 28.45000
    },
    {
      id: "CLI-003",
      nombre: "Distribuidora del Sureste",
      razon_social: "DISTRIBUIDORA DEL SURESTE JOYEROS S. DE R.L. DE C.V.",
      rfc: "DDS900303CC3",
      regimen_fiscal: "601",
      regimen_desc: "General de Ley Personas Morales",
      cp_fiscal: "97000",
      uso_cfdi: "G01",
      uso_cfdi_desc: "Adquisición de mercancías",
      correo_facturacion: "contabilidad@distsureste.com",
      condicion_pago: "15 días",
      dias_credito: 15,
      limite_credito: 800000.00,
      metodo_pago_defecto: "PPD",
      forma_pago_defecto: "03",
      contacto: "C.P. Mónica Aranda",
      sucursales_activas: 3,
      saldo_oro_fino_g: 0.00000
    }
  ];

  // =========================================================================
  // MÓDULO 5: CENTROS LOGÍSTICOS MLS / COPPEL
  // =========================================================================
  const clientes_centros_logisticos = [
    { id_centro: 1, cliente: "Montepío Luz Saviñón", numero_sucursal: "3032", nombre_sucursal: "3032 Cancún Centro", zona_ruta: "Sureste", direccion: "Av. Tulum 208 SM 4, Cancún, Q. Roo", sello_defecto: "Z008340", factura_sae: "SAE-F-90812" },
    { id_centro: 2, cliente: "Montepío Luz Saviñón", numero_sucursal: "3050", nombre_sucursal: "3050 Santa Fe Avant", zona_ruta: "Poniente CDMX", direccion: "Av. Vasco de Quiroga 3800, Santa Fe, CDMX", sello_defecto: "Z008341", factura_sae: "SAE-F-90813" },
    { id_centro: 3, cliente: "Montepío Luz Saviñón", numero_sucursal: "4015", nombre_sucursal: "4015 Ecatepec Vía Morelos", zona_ruta: "Norte / Oriente", direccion: "Vía Morelos Km 14.5, Ecatepec, Edo. Méx.", sello_defecto: "Z008342", factura_sae: "SAE-F-90814" },
    { id_centro: 4, cliente: "Montepío Luz Saviñón", numero_sucursal: "4031", nombre_sucursal: "4031 Texcoco Catedral", zona_ruta: "Oriente", direccion: "Calle Juárez Sur 112, Centro, Texcoco, Edo. Méx.", sello_defecto: "Z008343", factura_sae: "SAE-F-90815" }
  ];

  const coppel_branches = [
    { tienda_id: "3032-CANCUN", numero_sucursal: "3032", nombre: "3032 MLS Cancún / Coppel Nichupté", cedis: "CANCUN", zona: "Sureste", caja_sugerida: 1, sello_seguridad: "Z008340", factura_sae: "SAE-F-90812" },
    { tienda_id: "3050-SANTAFE", numero_sucursal: "3050", nombre: "3050 MLS Santa Fe Avant", cedis: "CDMX-PONIENTE", zona: "Centro", caja_sugerida: 1, sello_seguridad: "Z008341", factura_sae: "SAE-F-90813" },
    { tienda_id: "4015-ECATEPEC", numero_sucursal: "4015", nombre: "4015 Ecatepec Plaza Aragón / Vía Morelos", cedis: "IZTAPALAPA", zona: "Oriente", caja_sugerida: 2, sello_seguridad: "Z008342", factura_sae: "SAE-F-90814" },
    { tienda_id: "4031-TEXCOCO", numero_sucursal: "4031", nombre: "4031 Texcoco Centro", cedis: "IZTAPALAPA", zona: "Oriente", caja_sugerida: 2, sello_seguridad: "Z008343", factura_sae: "SAE-F-90815" },
    { tienda_id: "COP-001", numero_sucursal: "1001", nombre: "Coppel Huehuetoca", cedis: "IZTAPALAPA", zona: "Norte", caja_sugerida: 3, sello_seguridad: "Z008344", factura_sae: "SAE-F-90816" },
    { tienda_id: "COP-002", numero_sucursal: "1002", nombre: "Coppel Tultitlán Centro", cedis: "IZTAPALAPA", zona: "Norte", caja_sugerida: 3, sello_seguridad: "Z008345", factura_sae: "SAE-F-90817" },
    { tienda_id: "COP-004", numero_sucursal: "1004", nombre: "Coppel Puebla Centro", cedis: "PUEBLA", zona: "Sur", caja_sugerida: 4, sello_seguridad: "Z008346", factura_sae: "SAE-F-90818" },
    { tienda_id: "COP-005", numero_sucursal: "1005", nombre: "Coppel Tehuacán", cedis: "PUEBLA", zona: "Sur", caja_sugerida: 4, sello_seguridad: "Z008347", factura_sae: "SAE-F-90819" },
    { tienda_id: "COP-006", numero_sucursal: "1006", nombre: "Coppel San Luis Potosí Tangamanga", cedis: "SLP", zona: "Bajío", caja_sugerida: 5, sello_seguridad: "Z008348", factura_sae: "SAE-F-90820" },
    { tienda_id: "COP-007", numero_sucursal: "1007", nombre: "Coppel Guadalajara Centro", cedis: "GUADALAJARA", zona: "Occidente", caja_sugerida: 5, sello_seguridad: "Z008349", factura_sae: "SAE-F-90821" },
    { tienda_id: "COP-008", numero_sucursal: "1008", nombre: "Coppel Zapopan Plaza del Sol", cedis: "GUADALAJARA", zona: "Occidente", caja_sugerida: 6, sello_seguridad: "Z008350", factura_sae: "SAE-F-90822" },
    { tienda_id: "COP-009", numero_sucursal: "1009", nombre: "Coppel Tlaquepaque", cedis: "GUADALAJARA", zona: "Occidente", caja_sugerida: 6, sello_seguridad: "Z008351", factura_sae: "SAE-F-90823" },
    { tienda_id: "COP-010", numero_sucursal: "1010", nombre: "Coppel Monterrey Sendero", cedis: "MONTERREY", zona: "Noreste", caja_sugerida: 7, sello_seguridad: "Z008352", factura_sae: "SAE-F-90824" },
    { tienda_id: "COP-011", numero_sucursal: "1011", nombre: "Coppel San Pedro Garza", cedis: "MONTERREY", zona: "Noreste", caja_sugerida: 7, sello_seguridad: "Z008353", factura_sae: "SAE-F-90825" },
    { tienda_id: "COP-012", numero_sucursal: "1012", nombre: "Coppel Querétaro Constituyentes", cedis: "QUERETARO", zona: "Bajío", caja_sugerida: 8, sello_seguridad: "Z008354", factura_sae: "SAE-F-90826" },
    { tienda_id: "COP-013", numero_sucursal: "1013", nombre: "Coppel León Campestre", cedis: "LEON", zona: "Bajío", caja_sugerida: 8, sello_seguridad: "Z008355", factura_sae: "SAE-F-90827" },
    { tienda_id: "COP-014", numero_sucursal: "1014", nombre: "Coppel Irapuato Centro", cedis: "LEON", zona: "Bajío", caja_sugerida: 9, sello_seguridad: "Z008356", factura_sae: "SAE-F-90828" },
    { tienda_id: "COP-015", numero_sucursal: "1015", nombre: "Coppel Toluca Metepec", cedis: "TOLUCA", zona: "Centro", caja_sugerida: 9, sello_seguridad: "Z008357", factura_sae: "SAE-F-90829" },
    { tienda_id: "COP-016", numero_sucursal: "1016", nombre: "Coppel Cuernavaca Morelos", cedis: "CUERNAVACA", zona: "Sur", caja_sugerida: 10, sello_seguridad: "Z008358", factura_sae: "SAE-F-90830" },
    { tienda_id: "COP-017", numero_sucursal: "1017", nombre: "Coppel Veracruz Puerto", cedis: "VERACRUZ", zona: "Golfo", caja_sugerida: 10, sello_seguridad: "Z008359", factura_sae: "SAE-F-90831" },
    { tienda_id: "COP-018", numero_sucursal: "1018", nombre: "Coppel Xalapa Enríquez", cedis: "VERACRUZ", zona: "Golfo", caja_sugerida: 11, sello_seguridad: "Z008360", factura_sae: "SAE-F-90832" },
    { tienda_id: "COP-019", numero_sucursal: "1019", nombre: "Coppel Mérida Altabrisa", cedis: "MERIDA", zona: "Sureste", caja_sugerida: 11, sello_seguridad: "Z008361", factura_sae: "SAE-F-90833" },
    { tienda_id: "COP-020", numero_sucursal: "1020", nombre: "Coppel Mérida Centro", cedis: "MERIDA", zona: "Sureste", caja_sugerida: 12, sello_seguridad: "Z008362", factura_sae: "SAE-F-90834" },
    { tienda_id: "COP-022", numero_sucursal: "1022", nombre: "Coppel Oaxaca Juárez", cedis: "OAXACA", zona: "Sur", caja_sugerida: 12, sello_seguridad: "Z008363", factura_sae: "SAE-F-90835" },
    { tienda_id: "COP-024", numero_sucursal: "1024", nombre: "Coppel Pachuca Galerías", cedis: "PACHUCA", zona: "Centro", caja_sugerida: 13, sello_seguridad: "Z008364", factura_sae: "SAE-F-90836" },
    { tienda_id: "COP-025", numero_sucursal: "1025", nombre: "Coppel Tijuana Río", cedis: "TIJUANA", zona: "Noroeste", caja_sugerida: 13, sello_seguridad: "Z008365", factura_sae: "SAE-F-90837" }
  ];

  // =========================================================================
  // MÓDULO 3: GENERADOR DE SUB-PIEZAS INDIVIDUALES CON DESCUENTO CZ (4 DEC)
  // =========================================================================
  function generatePieces() {
    const pieces = [];
    const baseWeights = {
      "ANILLO-SOL-10K": [1.8520, 1.9240, 1.7810, 1.8830, 1.8410, 1.9050, 1.8200, 1.9510, 1.7940, 1.8720],
      "ESCLAVA-ORO-14K": [5.2010, 5.3420, 5.1250, 5.4010, 5.2500, 5.1840, 5.3120, 5.2800, 5.4510, 5.2230],
      "CADENA-ROLO-10K": [3.4020, 3.5210, 3.3840, 3.4500, 3.6010, 3.3520, 3.4830, 3.5510, 3.4200, 3.5040],
      "ARETE-ARO-14K": [1.7520, 1.8040, 1.7210, 1.7850, 1.8230, 1.7010, 1.7640, 1.8520, 1.7410, 1.8100],
      "DIJE-CORAZON-10K": [1.0520, 1.0840, 1.0210, 1.1230, 1.0650, 1.0410, 1.1020, 1.0740, 1.1410, 1.0320],
      "ANILLO-SELLO-14K": [4.7520, 4.9010, 4.7040, 4.8320, 4.9510, 4.7730, 4.8720, 4.8010, 4.9340, 4.7310],
      "PULSERA-ESLABON-18K": [7.2510, 7.4020, 7.1840, 7.3210, 7.5030, 7.2810, 7.3520, 7.4510, 7.2240, 7.3810],
      "CADENA-FIGARO-14K": [4.8020, 4.9510, 4.7540, 4.8820, 5.0210, 4.8230, 4.9010, 4.9840, 4.7810, 4.8520],
      "CRUZ-LISA-10K": [1.2210, 1.2740, 1.2030, 1.2410, 1.3020, 1.2140, 1.2630, 1.3210, 1.2340, 1.2810],
      "MEDALLA-OVAL-14K": [2.3450, 2.4650, 2.2950, 2.3950, 2.5250, 2.3250, 2.4250, 2.4950, 2.3650, 2.4450],
      "ANILLO-TRIO-18K": [4.0920, 4.2110, 4.0430, 4.1420, 4.2710, 4.0740, 4.1720, 4.2410, 4.1130, 4.1920],
      "CADENA-ITALIANA-10K": [2.9010, 3.0240, 2.8520, 2.9510, 3.0830, 2.8810, 2.9820, 3.0540, 2.9210, 3.0030],
      "PULSERA-PLATA-925": [8.4200, 8.5600, 8.3800, 8.6100, 8.4900, 8.5200, 8.4400, 8.5900, 8.4700, 8.5300]
    };

    const gavetaPorSku = {
      "ANILLO-SOL-10K": "BOVEDA-R1-N1-G01",
      "ESCLAVA-ORO-14K": "BOVEDA-R1-N2-G05",
      "CADENA-ROLO-10K": "BOVEDA-R2-N1-G03",
      "ARETE-ARO-14K": "BOVEDA-R2-N3-G08",
      "DIJE-CORAZON-10K": "BOVEDA-R2-N3-G08",
      "ANILLO-SELLO-14K": "BOVEDA-R1-N1-G01",
      "PULSERA-ESLABON-18K": "BOVEDA-R1-N2-G05",
      "CADENA-FIGARO-14K": "BOVEDA-R2-N1-G03",
      "CRUZ-LISA-10K": "BOVEDA-R2-N3-G08",
      "MEDALLA-OVAL-14K": "BOVEDA-R2-N3-G08",
      "ANILLO-TRIO-18K": "BOVEDA-R1-N1-G01",
      "CADENA-ITALIANA-10K": "BOVEDA-R2-N1-G03",
      "PULSERA-PLATA-925": "RACK_PLATA-R1-N1-G02"
    };

    let counter = 1;

    function buildPiece(p, wBruto, almacen_id, estatus, gavetaOverride, fechaStr) {
      const id = `PZ-2026-${String(counter++).padStart(4, "0")}`;
      const peso_bruto_g = +Number(wBruto).toFixed(4);
      const peso_piedra_g = +Number(p.peso_piedra_cz || 0).toFixed(4);
      const peso_neto_metal_g = +Math.max(0.1, peso_bruto_g - peso_piedra_g).toFixed(4);
      const factor = Number(p.factor_oro_fino ?? 0.41667);
      const gramos_oro_fino = +(peso_neto_metal_g * factor).toFixed(5);
      const codigo_gaveta = gavetaOverride || gavetaPorSku[p.sku] || "BOVEDA-R1-N1-G01";

      return {
        piece_id: id,
        id_pieza: id,
        sku_ref: p.sku,
        sku_14: p.sku_14,
        modelo_martela: p.modelo_martela,
        id_recepcion: 101,
        ubicacion_gaveta: codigo_gaveta,
        peso_bruto_g,
        peso_piedra_g,
        peso_neto_metal_g,
        peso_neto_g: +peso_neto_metal_g.toFixed(4), // compatibilidad con módulos previos
        gramos_oro_fino,
        almacen_id,
        estatus,
        fecha_ingreso: fechaStr,
        fecha_pesaje: `${fechaStr} 09:30:00`,
        order_id: null,
        box_id: null,
        store_id: null
      };
    }

    // 1. Crear 8 piezas iniciales por cada SKU (13 * 8 = 104 piezas)
    products_sku.forEach((p, pIdx) => {
      const arr = baseWeights[p.sku] || [2.2500, 2.3100, 2.1900, 2.2800];
      for (let i = 0; i < 8; i++) {
        const wBase = arr[i % arr.length];
        const variance = ((i * 7 + pIdx * 3) % 9 - 4) * 0.0035;
        const wBruto = +(wBase + variance).toFixed(4);

        let almacen_id = p.metal_tipo === "PLATA_925" ? "RACK_PLATA" : "BOVEDA_GENERAL";
        let estatus = "DISPONIBLE";
        if (i === 6) {
          almacen_id = "SUCURSAL_CDMX";
          estatus = "EXHIBICION";
        } else if (i === 7) {
          almacen_id = "SUCURSAL_MERIDA";
          estatus = "EXHIBICION";
        }

        const fechaStr = `2026-10-${String((counter % 15) + 1).padStart(2, "0")}`;
        pieces.push(buildPiece(p, wBruto, almacen_id, estatus, null, fechaStr));
      }
    });

    // 2. Generar 365 piezas adicionales en Bóveda para soportar el despiece B2B masivo (438 piezas)
    const goldProducts = products_sku.filter(p => p.metal_tipo !== "PLATA_925");
    for (let j = 0; j < 365; j++) {
      const p = goldProducts[j % goldProducts.length];
      const arr = baseWeights[p.sku] || [2.1000, 2.2000];
      const wBase = arr[j % arr.length];
      const variance = ((j * 13) % 15 - 7) * 0.0025;
      const wBruto = +(wBase + variance).toFixed(4);
      pieces.push(buildPiece(p, wBruto, "BOVEDA_GENERAL", "DISPONIBLE", null, "2026-10-05"));
    }

    // 3. Crear 4 piezas en Charola de Defectos / Fundición
    for (let k = 0; k < 4; k++) {
      const p = products_sku[0];
      const piece = buildPiece(p, 1.9850, "TALLER_FUNDICION", "EN_FUNDICION", "DEFECTOS-R1-N1-G01", "2026-10-12");
      piece.motivo_merma = "Pieza separada en Mesa de Control de Calidad (aro fracturado / circonia suelta)";
      pieces.push(piece);
    }

    return pieces;
  }

  const initial_pieces = generatePieces();

  // =========================================================================
  // MÓDULO 5: PEDIDOS B2B Y REMISIONES CON SELLO DE SEGURIDAD
  // =========================================================================
  const coppel_orders = [
    {
      order_id: "COP-2026-W42",
      cliente: "Montepío Luz Saviñón / Coppel B2B",
      fecha_descarga: "2026-10-14",
      fecha_entrega: "2026-10-21",
      total_piezas: 438,
      piezas_asignadas: 0,
      sello_seguridad_bolsa: "Z008340",
      factura_sae: "SAE-F-90812",
      peso_bolsa_verificado_g: 0,
      estatus: "EN_PREPARACION",
      notas: "Despiece semanal B2B · Incluye Centros Logísticos 3032 Cancún, 3050 Santa Fe Avant, 4015 Ecatepec, 4031 Texcoco y Red Coppel",
      sucursales: coppel_branches.map((b, idx) => ({
        ...b,
        piezas_solicitadas: idx < 22 ? 17 : 16,
        piezas_asignadas_ids: [],
        factura_folio: null,
        sello_seguridad_bolsa: b.sello_seguridad || `Z0083${40 + idx}`,
        factura_sae: b.factura_sae || `SAE-F-908${12 + idx}`,
        estatus_empaque: "PENDIENTE"
      }))
    },
    {
      order_id: "PED-2026-1041",
      cliente: "Joyas del Centro Mayoristas",
      fecha_descarga: "2026-10-13",
      fecha_entrega: "2026-10-18",
      total_piezas: 12,
      piezas_asignadas: 12,
      sello_seguridad_bolsa: "Z008310",
      factura_sae: "SAE-F-90790",
      estatus: "FACTURADO",
      notas: "Pedido mayorista surtido con descuento de circonia aplicado",
      sucursales: [
        {
          tienda_id: "JCE-MATRIZ",
          numero_sucursal: "0100",
          nombre: "Joyas del Centro - Matriz CDMX",
          cedis: "CDMX",
          zona: "Centro",
          caja_sugerida: 1,
          sello_seguridad_bolsa: "Z008310",
          factura_sae: "SAE-F-90790",
          piezas_solicitadas: 12,
          piezas_asignadas_ids: ["PZ-2026-0001", "PZ-2026-0002", "PZ-2026-0003"],
          factura_folio: "FAC-2026-1041",
          estatus_empaque: "COMPLETO"
        }
      ]
    }
  ];

  // =========================================================================
  // MÓDULO 6: RUTAS LOGÍSTICAS PWA Y EXPEDIENTE DIGITAL PLD
  // =========================================================================
  const routes = [
    {
      id: "RUT-2026-018",
      chofer: "Miguel Torres",
      auditor_pld: "Adriana López (Cumplimiento PLD)",
      vehiculo: "Van Blindada Nivel III - Placas 482-XYZ",
      fecha: "2026-10-17",
      estatus: "EN_CURSO",
      paradas: [
        {
          parada_id: "PAR-01",
          id_remision: "REM-2026-3050",
          centro_logistico: "3050",
          sucursal: "3050 Santa Fe Avant (MLS / B2B)",
          direccion: "Av. Vasco de Quiroga 3800, Santa Fe, CDMX",
          hora_programada: "09:00 AM",
          order_id: "COP-2026-W42",
          caja_numero: 1,
          piezas_caja: 17,
          sello_seguridad_bolsa: "Z008341",
          sello_validado: false,
          latitud: 19.361420,
          longitud: -99.273810,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "SAE-F-90813",
          expediente_pld_folio: "PLD-EXP-2026-3050",
          observaciones: "Validar sello plástico Z008341 antes de abrir valija en mostrador blindado."
        },
        {
          parada_id: "PAR-02",
          id_remision: "REM-2026-4015",
          centro_logistico: "4015",
          sucursal: "4015 Ecatepec Plaza Aragón / Vía Morelos",
          direccion: "Vía Morelos Km 14.5, Ecatepec, Edo. Méx.",
          hora_programada: "11:30 AM",
          order_id: "COP-2026-W42",
          caja_numero: 2,
          piezas_caja: 17,
          sello_seguridad_bolsa: "Z008342",
          sello_validado: false,
          latitud: 19.531240,
          longitud: -99.048910,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "SAE-F-90814",
          expediente_pld_folio: "PLD-EXP-2026-4015",
          observaciones: "Entregar en bóveda secundaria con firma del gerente y sello húmedo."
        },
        {
          parada_id: "PAR-03",
          id_remision: "REM-2026-4031",
          centro_logistico: "4031",
          sucursal: "4031 Texcoco Centro",
          direccion: "Calle Juárez Sur 112, Centro, Texcoco, Edo. Méx.",
          hora_programada: "02:15 PM",
          order_id: "COP-2026-W42",
          caja_numero: 2,
          piezas_caja: 17,
          sello_seguridad_bolsa: "Z008343",
          sello_validado: false,
          latitud: 19.511890,
          longitud: -98.882940,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "SAE-F-90815",
          expediente_pld_folio: "PLD-EXP-2026-4031",
          observaciones: "Requiere verificación de sello Z008343 y fotografía de acuse."
        },
        {
          parada_id: "PAR-04",
          id_remision: "REM-2026-1001",
          centro_logistico: "1001",
          sucursal: "Coppel Huehuetoca",
          direccion: "Av. Benito Juárez 104, Centro, Huehuetoca, Edo. Méx.",
          hora_programada: "04:30 PM",
          order_id: "COP-2026-W42",
          caja_numero: 3,
          piezas_caja: 17,
          sello_seguridad_bolsa: "Z008344",
          sello_validado: false,
          latitud: 19.834210,
          longitud: -99.204150,
          estatus: "PENDIENTE",
          hora_llegada: "",
          hora_salida: "",
          receptor_nombre: "",
          firma_canvas_data: "",
          evidencia_sello_url: "",
          folio_factura: "SAE-F-90816",
          expediente_pld_folio: "PLD-EXP-2026-1001",
          observaciones: "Acceso por rampa de valores Norte."
        }
      ]
    }
  ];

  const pld_evidencias_entrega = [];
  const pwa_offline_queue = [];

  // =========================================================================
  // FACTURACIÓN CFDI 4.0, COBRANZA, FUNDICIÓN Y AUDITORÍA
  // =========================================================================
  const invoices = [
    {
      id: "FAC-2026-1041",
      serie: "A",
      folio: 1041,
      uuid: "4E8B7F21-9C3D-4A5E-8B1C-2D3E4F5A6B7C",
      order_id: "PED-2026-1041",
      cliente_id: "CLI-002",
      cliente: "Joyas del Centro Mayoristas",
      razon_social: "JOYAS DEL CENTRO MAYORISTAS S.A. DE C.V.",
      rfc: "JCE850201BB2",
      regimen_fiscal: "601",
      cp_fiscal: "06000",
      uso_cfdi: "G01",
      fecha: "2026-10-15T11:20:00",
      fecha_vencimiento: "2026-10-15",
      tipo_comprobante: "I",
      metodo_pago: "PUE",
      forma_pago: "03",
      forma_pago_desc: "Transferencia electrónica (SPEI)",
      condiciones_pago: "Contado comercial",
      subtotal: 34850.00,
      impuesto_iva: 5576.00,
      total: 40426.00,
      saldo_pendiente: 0.00,
      estatus_pago: "PAGADA",
      estatus_sat: "VIGENTE",
      piezas_count: 12,
      gramos_totales: 23.40,
      vinculo_pld: "PLD-AUD-2026-088",
      partidas: [
        { sku: "ANILLO-SOL-10K", descripcion: "Anillo Solitario Imperial con Circonia Suiza Oro 10K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 6, peso_neto_g: 11.10, valor_unitario: 2850.00, importe: 17100.00, iva: 2736.00 },
        { sku: "CADENA-ROLO-10K", descripcion: "Cadena Rolo Eslabón Italiano Diamantado 10K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 6, peso_neto_g: 12.30, valor_unitario: 2958.33, importe: 17750.00, iva: 2840.00 }
      ]
    },
    {
      id: "FAC-2026-1040",
      serie: "A",
      folio: 1040,
      uuid: "8F3A2B1C-7E4D-4A5B-9C0D-1E2F3A4B5C6D",
      order_id: "PED-2026-1039",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      razon_social: "DISTRIBUIDORA DEL SURESTE JOYEROS S. DE R.L. DE C.V.",
      rfc: "DDS900303CC3",
      regimen_fiscal: "601",
      cp_fiscal: "97000",
      uso_cfdi: "G01",
      fecha: "2026-10-12T16:45:00",
      fecha_vencimiento: "2026-10-27",
      tipo_comprobante: "I",
      metodo_pago: "PPD",
      forma_pago: "99",
      forma_pago_desc: "Por definir (PPD)",
      condiciones_pago: "Crédito 15 días",
      subtotal: 85000.00,
      impuesto_iva: 13600.00,
      total: 98600.00,
      saldo_pendiente: 48600.00,
      estatus_pago: "PARCIAL",
      estatus_sat: "VIGENTE",
      piezas_count: 18,
      gramos_totales: 58.20,
      vinculo_pld: "PLD-AUD-2026-085",
      partidas: [
        { sku: "ESCLAVA-ORO-14K", descripcion: "Esclava Clásica Tejido Cubano Diamantado 14K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 10, peso_neto_g: 52.80, valor_unitario: 5500.00, importe: 55000.00, iva: 8800.00 },
        { sku: "ARETE-ARO-14K", descripcion: "Arete Arrancada Pavé con Micro-Circonias 14K", clave_sat: "54111601", unidad_sat: "H87", cantidad: 8, peso_neto_g: 5.40, valor_unitario: 3750.00, importe: 30000.00, iva: 4800.00 }
      ]
    }
  ];

  const payments_cxc = [
    {
      id: "PAG-2026-001",
      serie: "P",
      folio: 501,
      uuid: "9F8E7D6C-5B4A-3F2E-1D0C-9B8A7F6E5D4C",
      factura_id: "FAC-2026-1040",
      factura_uuid: "8F3A2B1C-7E4D-4A5B-9C0D-1E2F3A4B5C6D",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      rfc: "DDS900303CC3",
      fecha: "2026-10-16T14:30:00",
      monto: 50000.00,
      forma_pago: "03",
      forma_pago_desc: "Transferencia electrónica (SPEI)",
      numero_operacion: "SPEI-BBVA-7829103",
      saldo_anterior: 98600.00,
      saldo_insoluto: 48600.00,
      num_parcialidad: 1,
      estatus_sat: "VIGENTE"
    }
  ];

  const credit_notes = [
    {
      id: "NC-2026-001",
      serie: "NC",
      folio: 101,
      uuid: "2C3D4E5F-6A7B-8C9D-0E1F-2A3B4C5D6E7F",
      factura_id: "FAC-2026-1040",
      factura_uuid: "8F3A2B1C-7E4D-4A5B-9C0D-1E2F3A4B5C6D",
      cliente_id: "CLI-003",
      cliente: "Distribuidora del Sureste",
      rfc: "DDS900303CC3",
      fecha: "2026-10-17T17:00:00",
      subtotal: 4000.00,
      impuesto_iva: 640.00,
      total: 4640.00,
      motivo: "Devolución de 1 esclava 14K con cierre defectuoso (Canalizada al Taller de Fundición)",
      tipo_relacion: "01",
      tipo_relacion_desc: "Nota de crédito de los documentos relacionados",
      estatus_sat: "VIGENTE"
    }
  ];

  const foundry_logs = [
    {
      id: "FUN-2026-001",
      fecha: "2026-10-15",
      tecnico: "Roberto Silva",
      piezas_origen: ["PZ-ROT-001", "PZ-ROT-002", "PZ-DEV-008"],
      peso_entrada_g: 12.00,
      peso_recuperado_g: 10.20,
      diferencia_g: 1.80,
      merma_confirmada_g: 0.35,
      bote_rebabas_analisis_g: 1.45,
      estatus: "PENDIENTE_CONCILIACION",
      ley_oro_obtenida: "10K (41.667%)",
      acta_folio: "ACTA-FUND-882",
      notas: "Fusión de lote separado en Mesa de Calidad; 1.45g enviados al bote de rebabas para copelación."
    }
  ];

  const maquila_compensations = [
    {
      id: "MAQ-2026-001",
      cliente: "Montepío Luz Saviñón / Clientes Maquila",
      fecha: "2026-10-10",
      tipo_movimiento: "DEPOSITO_ORO_FINO",
      gramos_oro_fino: 150.00000,
      ley: "24K (99.9%)",
      folio_acta: "ACTA-ORO-FINO-410",
      saldo_restante_g: 145.80000,
      notas: "Oro fino 24K depositado para compensar cuenta corriente de metal en entregas de 10K y 14K."
    }
  ];

  const audit_logs = [
    {
      id: "AUD-2026-001",
      fecha: "2026-10-17 08:15:10",
      usuario: "David Morales",
      rol: "Almacén / Recepción",
      accion: "RECEPCION_VALIJA",
      entidad: "Recepción Paquetería",
      registro_id: "FDX-7894512039-HK",
      resultado: "4 bultos recibidos (2,840.50g) con Video-Evidencia vinculada"
    },
    {
      id: "AUD-2026-002",
      fecha: "2026-10-17 08:45:00",
      usuario: "Adriana López",
      rol: "Administración / Facturación",
      accion: "ACTUALIZACION_FIX",
      entidad: "Motor Financiero Fix",
      registro_id: "FIX-2026-10-17",
      resultado: "Tarifa Máxima Fix aplicada: $2,680.00 USD (FIX Ayer > FIX Hoy)"
    },
    {
      id: "AUD-2026-003",
      fecha: "2026-10-17 09:10:22",
      usuario: "Elisa Ramírez",
      rol: "Bóveda / Báscula Digital",
      accion: "PESAJE_SUBPIEZA",
      entidad: "Báscula Digital",
      registro_id: "PZ-2026-0001",
      resultado: "Bruto 1.8520g - CZ 0.1800g = Neto 1.6720g (0.69667g Oro Fino) -> BOVEDA-R1-N1-G01"
    }
  ];

  // =========================================================================
  // MÓDULO 0: COMPRAS INTERNACIONALES, ÓRDENES DE COMPRA (OC) Y PACKING LIST
  // =========================================================================
  const ordenes_compra = [
    {
      id_oc: 1,
      folio_oc: "OC-MARTELA-2026-0041",
      id_proveedor: 1,
      proveedor_nombre: "Shenzhen Finefey Jewelry Co., Ltd.",
      pais_origen: "CHINA",
      moneda: "USD",
      estatus: "BORRADOR",
      peso_oro_teorico_total_g: 485.5000,
      costo_mo_total_estimado: 2450.00,
      fix_oro_cerrado_usd: null,
      tipo_cambio_cerrado: null,
      importe_metal_total: 0,
      importe_total_liquidable: 2450.00,
      fecha_emision: "2026-10-15 10:30:00",
      fecha_promesa_entrega: "2026-12-15",
      notas: "Colección Anillos Solitarios y Dijes Navideños"
    },
    {
      id_oc: 2,
      folio_oc: "OC-MARTELA-2026-0042",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      moneda: "EUR",
      estatus: "PROFORMA_PENDIENTE",
      peso_oro_teorico_total_g: 1120.0000,
      costo_mo_total_estimado: 4800.00,
      fix_oro_cerrado_usd: null,
      tipo_cambio_cerrado: null,
      importe_metal_total: 0,
      importe_total_liquidable: 4800.00,
      fecha_emision: "2026-10-16 09:15:00",
      fecha_promesa_entrega: "2026-11-30",
      notas: "Cadenas diamantadas y esclavas tejido italiano"
    },
    {
      id_oc: 3,
      folio_oc: "OC-MARTELA-2026-0043",
      id_proveedor: 4,
      proveedor_nombre: "Lotus Gold Kuyumculuk A.S.",
      pais_origen: "TURQUIA",
      moneda: "USD",
      estatus: "PACKING_AUDITADO",
      peso_oro_teorico_total_g: 850.0000,
      peso_packing_total_g: 862.0000,
      variacion_peso_total_pct: 1.41,
      costo_mo_total_estimado: 3200.00,
      fix_oro_cerrado_usd: null,
      tipo_cambio_cerrado: null,
      importe_metal_total: 0,
      importe_total_liquidable: 3200.00,
      fecha_emision: "2026-10-12 11:00:00",
      fecha_promesa_entrega: "2026-11-20",
      notas: "Arracadas huecas 14K con packing list auditado dentro de tolerancia (+1.41%)"
    },
    {
      id_oc: 4,
      folio_oc: "OC-MARTELA-2026-0044",
      id_proveedor: 5,
      proveedor_nombre: "Arpas Export Jewelry Istanbul",
      pais_origen: "TURQUIA",
      moneda: "USD",
      estatus: "FIX_CERRADO",
      peso_oro_teorico_total_g: 620.0000,
      peso_packing_total_g: 628.5000,
      variacion_peso_total_pct: 1.37,
      costo_mo_total_estimado: 2800.00,
      fix_oro_cerrado_usd: 2680.00,
      tipo_cambio_cerrado: 20.1500,
      importe_metal_total: 31602.84,
      importe_total_liquidable: 34402.84,
      importe_total_liquidable_mxn: 693217.23,
      fecha_emision: "2026-10-10 14:20:00",
      fecha_cierre_fix: "2026-10-14 16:00:00",
      fecha_promesa_entrega: "2026-11-10",
      notas: "Fix congelado a $2,680.00 USD/oz. Listo para anticipo del 50%"
    },
    {
      id_oc: 5,
      folio_oc: "OC-MARTELA-2026-0045",
      id_proveedor: 3,
      proveedor_nombre: "Italoro Arezzo S.p.A.",
      pais_origen: "ITALIA",
      moneda: "USD",
      estatus: "EN_TRANSITO",
      peso_oro_teorico_total_g: 1350.0000,
      peso_packing_total_g: 1362.4000,
      variacion_peso_total_pct: 0.92,
      costo_mo_total_estimado: 5400.00,
      fix_oro_cerrado_usd: 2650.00,
      tipo_cambio_cerrado: 19.8500,
      importe_metal_total: 67608.20,
      importe_total_liquidable: 73008.20,
      importe_total_liquidable_mxn: 1449212.77,
      guia_tracking: "FDX-7894512039-HK",
      transportista: "FedEx Express",
      agente_aduanal: "Eduardo Mendoza (Agencia Aduanal del Valle)",
      fecha_emision: "2026-10-05 08:30:00",
      fecha_cierre_fix: "2026-10-09 12:00:00",
      fecha_embarque: "2026-10-15",
      fecha_estimada_arribo: "2026-10-18",
      notas: "Valija aérea en vuelo internacional hacia CDMX. Enlace a Módulo 2"
    }
  ];

  const orden_compra_lineas = [
    {
      id_linea: 1,
      id_oc: 1,
      sku: "07502278209688",
      modelo_proveedor: "FF-8821-CZ",
      descripcion: "Anillo Solitario Imperial con Circonia Suiza Oro 10K",
      kilataje: "10K",
      cantidad_piezas: 150,
      peso_teorico_unitario_g: 1.8500,
      peso_teorico_total_g: 277.5000,
      costo_mo_unitario: 9.50,
      costo_mo_total: 1425.00,
      peso_packing_unitario_g: 0.0000,
      peso_packing_total_g: 0.0000,
      variacion_peso_porcentaje: 0.00,
      estatus_tolerancia: "PENDIENTE"
    },
    {
      id_linea: 2,
      id_oc: 1,
      sku: "07502278209725",
      modelo_proveedor: "FF-DIJE-CORAZON",
      descripcion: "Dije Corazón Facetado Grabado Láser Oro 14K",
      kilataje: "14K",
      cantidad_piezas: 80,
      peso_teorico_unitario_g: 2.6000,
      peso_teorico_total_g: 208.0000,
      costo_mo_unitario: 12.8125,
      costo_mo_total: 1025.00,
      peso_packing_unitario_g: 0.0000,
      peso_packing_total_g: 0.0000,
      variacion_peso_porcentaje: 0.00,
      estatus_tolerancia: "PENDIENTE"
    },
    {
      id_linea: 3,
      id_oc: 3,
      sku: "07502278209701",
      modelo_proveedor: "LT-ARR-320",
      descripcion: "Arracada Huggie Tubular Diamantada Oro 14K",
      kilataje: "14K",
      cantidad_piezas: 200,
      peso_teorico_unitario_g: 2.4000,
      peso_teorico_total_g: 480.0000,
      costo_mo_unitario: 8.50,
      costo_mo_total: 1700.00,
      peso_packing_unitario_g: 2.4400,
      peso_packing_total_g: 488.0000,
      variacion_peso_porcentaje: 1.67,
      estatus_tolerancia: "DENTRO_RANGO"
    },
    {
      id_linea: 4,
      id_oc: 3,
      sku: "07502278209718",
      modelo_proveedor: "LT-BRQ-BOLA",
      descripcion: "Broquel Bolita Lisa Dormilona Oro 10K",
      kilataje: "10K",
      cantidad_piezas: 300,
      peso_teorico_unitario_g: 1.2333,
      peso_teorico_total_g: 370.0000,
      costo_mo_unitario: 5.00,
      costo_mo_total: 1500.00,
      peso_packing_unitario_g: 1.2467,
      peso_packing_total_g: 374.0000,
      variacion_peso_porcentaje: 1.08,
      estatus_tolerancia: "DENTRO_RANGO"
    },
    {
      id_linea: 5,
      id_oc: 4,
      sku: "07502278209695",
      modelo_proveedor: "ARP-CAD-ROLO",
      descripcion: "Esclava Tejido Cubano Broche de Caja Oro 14K",
      kilataje: "14K",
      cantidad_piezas: 100,
      peso_teorico_unitario_g: 6.2000,
      peso_teorico_total_g: 620.0000,
      costo_mo_unitario: 28.00,
      costo_mo_total: 2800.00,
      peso_packing_unitario_g: 6.2850,
      peso_packing_total_g: 628.5000,
      variacion_peso_porcentaje: 1.37,
      estatus_tolerancia: "DENTRO_RANGO"
    },
    {
      id_linea: 6,
      id_oc: 5,
      sku: "07502278209695",
      modelo_proveedor: "ITL-ARZ-552",
      descripcion: "Esclava Tejido Cubano Broche de Caja Oro 14K",
      kilataje: "14K",
      cantidad_piezas: 200,
      peso_teorico_unitario_g: 6.7500,
      peso_teorico_total_g: 1350.0000,
      costo_mo_unitario: 27.00,
      costo_mo_total: 5400.00,
      peso_packing_unitario_g: 6.8120,
      peso_packing_total_g: 1362.4000,
      variacion_peso_porcentaje: 0.92,
      estatus_tolerancia: "DENTRO_RANGO"
    }
  ];

  const compras_logistica_importacion = [
    {
      id_logistica: 1,
      id_oc: 5,
      transportista_aerolinea: "FedEx Express",
      guia_tracking: "FDX-7894512039-HK",
      agente_aduanal: "Eduardo Mendoza (Agencia Aduanal del Valle)",
      costo_flete_divisa: 485.00,
      impuestos_aduanales_mxn: 23187.00,
      estatus_transito: "EN_VUELO",
      origen: "Aeropuerto de Milán Malpensa (MXP)",
      destino: "Aeropuerto Internacional Benito Juárez CDMX (MEX)",
      fecha_salida: "2026-10-15",
      fecha_estimada_arribo: "2026-10-18"
    }
  ];

  const proveedor_estado_cuenta = [
    {
      id_movimiento: 1,
      id_proveedor: 3,
      id_oc: 5,
      tipo_movimiento: "CARGO_COMPRA",
      folio_documento: "PI-ITL-2026-0881",
      monto_divisa: 73008.20,
      moneda: "USD",
      observaciones: "Cargo total orden OC-MARTELA-2026-0045 (Metal Fix $2650 + M.O.)",
      fecha_registro: "2026-10-09 14:00:00"
    },
    {
      id_movimiento: 2,
      id_proveedor: 3,
      id_oc: 5,
      tipo_movimiento: "ANTICIPO_PAGADO",
      folio_documento: "SPEI-BBVA-908123",
      monto_divisa: -36504.10,
      moneda: "USD",
      observaciones: "Anticipo del 50% de producción transferido a Milán",
      fecha_registro: "2026-10-10 11:30:00"
    },
    {
      id_movimiento: 3,
      id_proveedor: 3,
      id_oc: null,
      tipo_movimiento: "NOTA_CREDITO_DEFECTOS",
      folio_documento: "NC-PROV-2026-0012",
      monto_divisa: -480.00,
      moneda: "USD",
      observaciones: "Nota de crédito por 2 esclavas porosas remitidas a fundición por David Morales",
      fecha_registro: "2026-10-12 16:45:00"
    },
    {
      id_movimiento: 4,
      id_proveedor: 5,
      id_oc: 4,
      tipo_movimiento: "CARGO_COMPRA",
      folio_documento: "PI-ARP-2026-4402",
      monto_divisa: 34402.84,
      moneda: "USD",
      observaciones: "Cargo compra OC-MARTELA-2026-0044 Fix $2,680.00 USD",
      fecha_registro: "2026-10-14 16:30:00"
    },
    {
      id_movimiento: 5,
      id_proveedor: 5,
      id_oc: 4,
      tipo_movimiento: "ANTICIPO_PAGADO",
      folio_documento: "SWIFT-CITI-449102",
      monto_divisa: -17201.42,
      moneda: "USD",
      observaciones: "Anticipo 50% para arranque de producción en Estambul",
      fecha_registro: "2026-10-15 09:20:00"
    }
  ];

  return {
    getInitialData: function() {
      let finalProveedores = proveedores;
      let finalProducts = products_sku;
      let finalEquiv = proveedor_modelo_equivalencia;

      // Enriquecimiento con los datos reales del libro ALTAS Y SKUS DE MODELOS PROVEEDORES
      if (typeof window !== 'undefined' && window.MartelaWorkbookData) {
        if (Array.isArray(window.MartelaWorkbookData.proveedores) && window.MartelaWorkbookData.proveedores.length > 0) {
          finalProveedores = window.MartelaWorkbookData.proveedores;
        }

        if (Array.isArray(window.MartelaWorkbookData.productos) && window.MartelaWorkbookData.productos.length > 0) {
          const seenSkus = new Set(products_sku.map(p => p.sku_14 || p.sku));
          const extraProducts = window.MartelaWorkbookData.productos.filter(p => !seenSkus.has(p.sku_14) && !seenSkus.has(p.sku));
          finalProducts = [...products_sku, ...extraProducts];

          const extraEquiv = extraProducts
            .filter(p => p.modelo_proveedor && String(p.modelo_proveedor).trim() !== '')
            .map((p, idx) => ({
              id: proveedor_modelo_equivalencia.length + idx + 1,
              id_proveedor: p.id_proveedor || 1,
              codigo_proveedor: p.modelo_proveedor,
              sku_martela: p.sku,
              modelo_martela: p.modelo_martela,
              fecha_alta: "2026-03-02",
              activo: true
            }));
          finalEquiv = [...proveedor_modelo_equivalencia, ...extraEquiv];
        }
      }

      return {
        proveedores: JSON.parse(JSON.stringify(finalProveedores)),
        products_sku: JSON.parse(JSON.stringify(finalProducts)),
        proveedor_modelo_equivalencia: JSON.parse(JSON.stringify(finalEquiv)),
        recepciones_paqueteria: JSON.parse(JSON.stringify(recepciones_paqueteria)),
        inspecciones_calidad: JSON.parse(JSON.stringify(inspecciones_calidad)),
        ubicaciones_gavetas: JSON.parse(JSON.stringify(ubicaciones_gavetas)),
        warehouses: JSON.parse(JSON.stringify(warehouses)),
        inventory_pieces: JSON.parse(JSON.stringify(initial_pieces)),
        metal_rates: JSON.parse(JSON.stringify(metal_rates)),
        clients: JSON.parse(JSON.stringify(clients)),
        clientes_centros_logisticos: JSON.parse(JSON.stringify(clientes_centros_logisticos)),
        coppel_branches: JSON.parse(JSON.stringify(coppel_branches)),
        coppel_orders: JSON.parse(JSON.stringify(coppel_orders)),
        invoices: JSON.parse(JSON.stringify(invoices)),
        payments_cxc: JSON.parse(JSON.stringify(payments_cxc)),
        credit_notes: JSON.parse(JSON.stringify(credit_notes)),
        routes: JSON.parse(JSON.stringify(routes)),
        pld_evidencias_entrega: JSON.parse(JSON.stringify(pld_evidencias_entrega)),
        pwa_offline_queue: JSON.parse(JSON.stringify(pwa_offline_queue)),
        foundry_logs: JSON.parse(JSON.stringify(foundry_logs)),
        maquila_compensations: JSON.parse(JSON.stringify(maquila_compensations)),
        audit_logs: JSON.parse(JSON.stringify(audit_logs)),
        ordenes_compra: JSON.parse(JSON.stringify(ordenes_compra)),
        orden_compra_lineas: JSON.parse(JSON.stringify(orden_compra_lineas)),
        compras_logistica_importacion: JSON.parse(JSON.stringify(compras_logistica_importacion)),
        proveedor_estado_cuenta: JSON.parse(JSON.stringify(proveedor_estado_cuenta)),
        counter: 500
      };
    }
  };
})();
