import PDFDocument from 'pdfkit';

/**
 * Servicio de Generación de Boleta Oficial de Referencia Obstétrica (MSPAS)
 * Diseño tipográfico estructurado y sin solapamientos
 */
export const generarBoletaReferenciaPDF = (ficha, res) => {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 30, bottom: 30, left: 36, right: 36 }
  });

  const correlativo = ficha.codigo_correlativo || `REF-SUCH-2026-00${ficha.id_ficha || '01'}`;

  // Configurar encabezados HTTP para descarga
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Boleta_Referencia_${correlativo}.pdf"`);

  doc.pipe(res);

  const PAGE_WIDTH = 540;
  const MARGIN_LEFT = 36;

  // 1. ENCABEZADO INSTITUCIONAL
  doc
    .rect(MARGIN_LEFT, 30, PAGE_WIDTH, 58)
    .fill('#0f172a');

  doc
    .fillColor('#ffffff')
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .text('GOBIERNO DE GUATEMALA - MINISTERIO DE SALUD PÚBLICA Y ASISTENCIA SOCIAL', MARGIN_LEFT, 38, { align: 'center', width: PAGE_WIDTH });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .text('Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS) de Suchitepéquez', MARGIN_LEFT, 52, { align: 'center', width: PAGE_WIDTH });

  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#38bdf8')
    .text('BOLETA OFICIAL DE REFERENCIA POR ALTO RIESGO OBSTÉTRICO (ARO)', MARGIN_LEFT, 68, { align: 'center', width: PAGE_WIDTH });

  // 2. BLOQUE DE IDENTIFICACIÓN Y DESTINO (FILAS SEPARADAS)
  let y = 96;

  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 60)
    .lineWidth(1)
    .strokeColor('#cbd5e1')
    .fillAndStroke('#f8fafc', '#cbd5e1');

  // Fila 1: Código de Referencia y Fecha
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('CÓDIGO DE REFERENCIA:', MARGIN_LEFT + 8, y + 8, { width: 130 });

  doc
    .fillColor('#b91c1c')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text(correlativo, MARGIN_LEFT + 140, y + 8, { width: 160 });

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('FECHA DE EMISIÓN:', MARGIN_LEFT + 320, y + 8, { width: 100 });

  doc
    .fillColor('#334155')
    .font('Helvetica')
    .fontSize(8)
    .text(new Date().toLocaleDateString('es-GT', { year: 'numeric', month: 'long', day: 'numeric' }), MARGIN_LEFT + 420, y + 8, { width: 110, align: 'right' });

  // Fila 2: Hospital de Destino
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('ESTABLECIMIENTO DESTINO:', MARGIN_LEFT + 8, y + 25, { width: 130 });

  doc
    .fillColor('#1e40af')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('HOSPITAL NACIONAL DE MAZATENANGO (Nivel II / III)', MARGIN_LEFT + 140, y + 25, { width: 390 });

  // Fila 3: Nivel de Urgencia
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('NIVEL DE URGENCIA:', MARGIN_LEFT + 8, y + 42, { width: 130 });

  const urgenciaTexto = ficha.nivel_urgencia === 'EMERGENCIA_INMEDIATA'
    ? 'EMERGENCIA INMEDIATA (CÓDIGO ROJO)'
    : (ficha.nivel_urgencia || 'ALTO RIESGO SEVERO');

  doc
    .fillColor(ficha.nivel_urgencia === 'EMERGENCIA_INMEDIATA' ? '#b91c1c' : '#c2410c')
    .font('Helvetica-Bold')
    .fontSize(8)
    .text(urgenciaTexto, MARGIN_LEFT + 140, y + 42, { width: 390 });

  // 3. DATOS GENERALES DE LA GESTANTE
  y = 164;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 18)
    .fill('#e2e8f0');

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('1. DATOS GENERALES DE LA GESTANTE', MARGIN_LEFT + 8, y + 5);

  y += 22;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 54)
    .strokeColor('#cbd5e1')
    .fillAndStroke('#ffffff', '#cbd5e1');

  // Paciente Fila 1
  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text('CUI / DPI:', MARGIN_LEFT + 8, y + 6, { width: 60 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .text(ficha.cui_dpi || 'N/D', MARGIN_LEFT + 70, y + 6, { width: 130 });

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('NOMBRE COMPLETO:', MARGIN_LEFT + 210, y + 6, { width: 100 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text(`${ficha.nombres || ''} ${ficha.apellidos || ''}`, MARGIN_LEFT + 310, y + 6, { width: 220 });

  // Paciente Fila 2
  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('MUNICIPIO:', MARGIN_LEFT + 8, y + 22, { width: 60 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .text(ficha.municipio || 'Suchitepéquez', MARGIN_LEFT + 70, y + 22, { width: 130 });

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('COMUNIDAD / DIR:', MARGIN_LEFT + 210, y + 22, { width: 100 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .text(ficha.direccion || ficha.comunidad || 'No indicada', MARGIN_LEFT + 310, y + 22, { width: 220 });

  // Paciente Fila 3
  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('TELÉFONO:', MARGIN_LEFT + 8, y + 38, { width: 60 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .text(ficha.telefono || 'Sin teléfono', MARGIN_LEFT + 70, y + 38, { width: 130 });

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('HISTORIAL G-P-C-A:', MARGIN_LEFT + 210, y + 38, { width: 100 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text(`Gestas: ${ficha.gestas_previas || 0}   |   Partos: ${ficha.partos_previos || 0}   |   Cesáreas: ${ficha.cesareas_previas || 0}   |   Abortos: ${ficha.abortos_previos || 0}`, MARGIN_LEFT + 310, y + 38, { width: 220 });

  // 4. EVALUACIÓN CLÍNICA Y SIGNOS VITALES
  y = 248;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 18)
    .fill('#e2e8f0');

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('2. EVALUACIÓN CLÍNICA Y SIGNOS VITALES MATERNO-FETALES', MARGIN_LEFT + 8, y + 5);

  y += 22;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 38)
    .strokeColor('#cbd5e1')
    .fillAndStroke('#ffffff', '#cbd5e1');

  // Biometría Fila 1
  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text('SEM. GESTACIÓN:', MARGIN_LEFT + 8, y + 6, { width: 90 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text(`${ficha.semanas_gestacion || 'N/D'} semanas`, MARGIN_LEFT + 98, y + 6, { width: 80 });

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('PRESIÓN ARTERIAL:', MARGIN_LEFT + 190, y + 6, { width: 95 });
  doc
    .fillColor(ficha.presion_sistolica >= 140 || ficha.presion_diastolica >= 90 ? '#b91c1c' : '#0f172a')
    .font('Helvetica-Bold')
    .text(`${ficha.presion_sistolica || 'N/D'} / ${ficha.presion_diastolica || 'N/D'} mmHg`, MARGIN_LEFT + 288, y + 6, { width: 80 });

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('FC FETAL:', MARGIN_LEFT + 385, y + 6, { width: 60 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .text(`${ficha.frecuencia_cardiaca_fetal || 'N/D'} lpm`, MARGIN_LEFT + 448, y + 6, { width: 85 });

  // Biometría Fila 2
  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('PESO / TALLA:', MARGIN_LEFT + 8, y + 22, { width: 90 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .text(`${ficha.peso_kg || 'N/D'} kg  /  ${ficha.talla_cm || 'N/D'} cm`, MARGIN_LEFT + 98, y + 22, { width: 80 });

  doc
    .fillColor('#475569')
    .font('Helvetica-Bold')
    .text('ÍNDICE MASA CORP.:', MARGIN_LEFT + 190, y + 22, { width: 95 });
  doc
    .fillColor('#0f172a')
    .font('Helvetica')
    .text(`${ficha.imc ? `${ficha.imc} kg/m²` : 'N/D'} (${ficha.estado_nutricional || 'Normal'})`, MARGIN_LEFT + 288, y + 22, { width: 240 });

  // 5. FACTORES ARO IDENTIFICADOS (25 INDICADORES NORMATIVA MSPAS)
  y = 316;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 18)
    .fill('#fee2e2');

  doc
    .fillColor('#991b1b')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('3. FACTORES DE ALTO RIESGO OBSTÉTRICO IDENTIFICADOS (NORMATIVA MSPAS)', MARGIN_LEFT + 8, y + 5);

  y += 22;

  const factoresLista = [];
  if (ficha.ind_01_edad_menor_20) factoresLista.push('Ind 01: Gestante adolescente menor de 20 años (Categoría I: Antecedente G-O)');
  if (ficha.ind_02_edad_mayor_35) factoresLista.push('Ind 02: Edad materna avanzada mayor o igual a 35 años (Categoría I: Antecedente G-O)');
  if (ficha.ind_03_antecedente_abortos_3) factoresLista.push('Ind 03: Antecedente de ≥3 abortos espontáneos (Categoría I: Antecedente G-O)');
  if (ficha.ind_04_muerte_fetal_neonatal_previa) factoresLista.push('Ind 04: Muerte fetal o neonatal previa (Categoría I: Antecedente G-O)');
  if (ficha.ind_05_parto_prematuro_previo) factoresLista.push('Ind 05: Parto prematuro previo (<37 sem) o bajo peso (Categoría I)');
  if (ficha.ind_06_cesarea_previa) factoresLista.push('Ind 06: Cesárea o cirugía uterina previa (Categoría I: Cicatriz uterina)');
  if (ficha.ind_07_periodo_intergenesico_corto) factoresLista.push('Ind 07: Periodo intergenésico corto (< 2 años) (Categoría I)');
  if (ficha.ind_08_gran_multipara) factoresLista.push('Ind 08: Gran multípara con 4 o más partos previos (Categoría I)');
  if (ficha.ind_09_hta_cronica) factoresLista.push('Ind 09: Hipertensión arterial crónica diagnosticada (Categoría II: Patología Actual)');
  if (ficha.ind_10_diabetes) factoresLista.push('Ind 10: Diabetes pregestacional o gestacional (Categoría II: Patología Actual)');
  if (ficha.ind_11_presion_alta_actual) factoresLista.push('Ind 11: Presión arterial actual ≥ 140/90 mmHg (Categoría II: Severo / Preeclampsia)');
  if (ficha.ind_12_hemorragia_1er_trim) factoresLista.push('Ind 12: Hemorragia transvaginal en 1er trimestre (Categoría II)');
  if (ficha.ind_13_hemorragia_2do_3er_trim) factoresLista.push('Ind 13: Hemorragia transvaginal en 2do o 3er trimestre (Categoría II: Severo)');
  if (ficha.ind_14_embarazo_multiple) factoresLista.push('Ind 14: Embarazo múltiple confirmado (Categoría II)');
  if (ficha.ind_15_presentacion_no_cefalica) factoresLista.push('Ind 15: Presentación no cefálica >36 semanas (Categoría II)');
  if (ficha.ind_16_ruptura_membranas_rpm) factoresLista.push('Ind 16: Ruptura prematura de membranas (RPM) (Categoría II)');
  if (ficha.ind_17_infeccion_urinaria_recurrente) factoresLista.push('Ind 17: Infección de vías urinarias recurrente (Categoría II)');
  if (ficha.ind_18_its_vih) factoresLista.push('Ind 18: Infección de transmisión sexual activa o VIH (Categoría II)');
  if (ficha.ind_19_talla_baja) factoresLista.push('Ind 19: Talla baja materna (< 145 cm) (Categoría III: Nutricional/Biopsicosocial)');
  if (ficha.ind_20_desnutricion_imc_bajo) factoresLista.push('Ind 20: Desnutrición materna con IMC < 18.5 kg/m² (Categoría III)');
  if (ficha.ind_21_obesidad_imc_alto) factoresLista.push('Ind 21: Obesidad materna con IMC ≥ 30.0 kg/m² (Categoría III)');
  if (ficha.ind_22_anemia) factoresLista.push('Ind 22: Anemia clínica / laboratorio Hb < 11 g/dL (Categoría III)');
  if (ficha.ind_23_cardiopatia_cronica) factoresLista.push('Ind 23: Cardiopatía, nefropatía u otra patología crónica (Categoría III)');
  if (ficha.ind_24_sin_control_prenatal) factoresLista.push('Ind 24: Captación tardía sin control prenatal en 1er/2do trimestre (Categoría III)');
  if (ficha.ind_25_vulnerabilidad_violencia) factoresLista.push('Ind 25: Vulnerabilidad extrema o violencia intrafamiliar (Categoría III)');

  if (factoresLista.length === 0) {
    factoresLista.push('Criterio clínico de sospecha o severidad obstétrica detectado durante el control.');
  }

  const alturaFactores = Math.max(70, Math.min(factoresLista.length * 15 + 16, 120));
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, alturaFactores)
    .strokeColor('#fecaca')
    .fillAndStroke('#fff5f5', '#fecaca');

  let indicadorY = y + 8;
  doc.fillColor('#7f1d1d').font('Helvetica-Bold').fontSize(7.5);
  factoresLista.slice(0, 7).forEach((f) => {
    doc.text(`• ${f}`, MARGIN_LEFT + 8, indicadorY, { width: PAGE_WIDTH - 16 });
    indicadorY += 14;
  });

  // 6. OBSERVACIONES CLÍNICAS Y MOTIVO DE TRASLADO
  y += alturaFactores + 8;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 18)
    .fill('#e2e8f0');

  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .text('4. OBSERVACIONES CLÍNICAS Y MOTIVO DE TRASLADO', MARGIN_LEFT + 8, y + 5);

  y += 22;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 44)
    .strokeColor('#cbd5e1')
    .fillAndStroke('#ffffff', '#cbd5e1');

  const obsTexto = ficha.observaciones_clinicas
    ? ficha.observaciones_clinicas
    : 'Paciente gestante referida por presentar criterios de Alto Riesgo Obstétrico (ARO) normados por el MSPAS. Requiere evaluación médica especializada, monitoreo materno-fetal y resolución en segundo/tercer nivel de atención de la red hospitalaria.';

  doc
    .fillColor('#334155')
    .font('Helvetica')
    .fontSize(7.5)
    .text(obsTexto, MARGIN_LEFT + 8, y + 6, { width: PAGE_WIDTH - 16, align: 'justify' });

  // 7. FIRMAS Y SELLOS INSTITUCIONALES
  y += 52;
  const colWidth = (PAGE_WIDTH - 12) / 2;

  doc
    .rect(MARGIN_LEFT, y, colWidth, 75)
    .strokeColor('#94a3b8')
    .fillAndStroke('#ffffff', '#94a3b8');

  doc
    .rect(MARGIN_LEFT + colWidth + 12, y, colWidth, 75)
    .strokeColor('#94a3b8')
    .fillAndStroke('#ffffff', '#94a3b8');

  doc
    .fillColor('#334155')
    .font('Helvetica-Bold')
    .fontSize(7.5)
    .text('MÉDICO / ENFERMERO REMITENTE', MARGIN_LEFT + 8, y + 6, { width: colWidth - 16 })
    .text('RECEPCIÓN HOSPITAL NACIONAL MAZATENANGO', MARGIN_LEFT + colWidth + 20, y + 6, { width: colWidth - 16 });

  doc
    .font('Helvetica')
    .fontSize(7)
    .text('Nombre: _________________________________', MARGIN_LEFT + 8, y + 38)
    .text('Firma y Sello: __________________________', MARGIN_LEFT + 8, y + 56)
    .text('Recibido por: ___________________________', MARGIN_LEFT + colWidth + 20, y + 38)
    .text('Fecha / Hora: ____________ Firma: _______', MARGIN_LEFT + colWidth + 20, y + 56);

  // PIE DE PÁGINA INSTITUCIONAL
  doc
    .fontSize(6.5)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text('Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS) de Suchitepéquez - Sistema SIREP MSPAS (Proyecto Génesis)', MARGIN_LEFT, 742, { align: 'center', width: PAGE_WIDTH });

  doc.end();
};

/**
 * Servicio de Generación de Informe Epidemiológico y Estadísticas Gerenciales (MSPAS)
 */
export const generarInformeGerencialPDF = (datos, res) => {
  const doc = new PDFDocument({
    size: 'LETTER',
    margins: { top: 25, bottom: 25, left: 36, right: 36 }
  });

  const fechaHoy = new Date().toLocaleDateString('es-GT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  const timestamp = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Informe_Epidemiologico_DDRISS_${timestamp}.pdf"`);

  doc.pipe(res);

  const PAGE_WIDTH = 540;
  const MARGIN_LEFT = 36;

  // 1. ENCABEZADO INSTITUCIONAL
  doc
    .rect(MARGIN_LEFT, 25, PAGE_WIDTH, 56)
    .fill('#0f172a');

  doc
    .fillColor('#ffffff')
    .fontSize(9.5)
    .font('Helvetica-Bold')
    .text('GOBIERNO DE GUATEMALA - MINISTERIO DE SALUD PÚBLICA Y ASISTENCIA SOCIAL', MARGIN_LEFT, 33, { align: 'center', width: PAGE_WIDTH });

  doc
    .fontSize(8.5)
    .font('Helvetica')
    .text('Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS) de Suchitepéquez', MARGIN_LEFT, 46, { align: 'center', width: PAGE_WIDTH });

  doc
    .fontSize(10.5)
    .font('Helvetica-Bold')
    .fillColor('#38bdf8')
    .text('INFORME EPIDEMIOLÓGICO GERENCIAL — VIGILANCIA ARO', MARGIN_LEFT, 61, { align: 'center', width: PAGE_WIDTH });

  // 2. METADATOS DEL INFORME CON FILTROS APLICADOS
  let y = 88;
  const f = datos.filtros || {};
  const txtMunicipio = f.municipio && f.municipio !== 'TODOS' ? f.municipio : 'Todo el Departamento';
  const txtRango = (f.fecha_inicio || f.fecha_fin)
    ? `${f.fecha_inicio || 'Inicio'} al ${f.fecha_fin || 'Hoy'}`
    : 'Histórico Completo';

  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 24)
    .fillAndStroke('#f1f5f9', '#cbd5e1');

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(7)
    .text(`FECHA: ${fechaHoy}`, MARGIN_LEFT + 8, y + 8)
    .text(`MUNICIPIO: ${txtMunicipio}`, MARGIN_LEFT + 150, y + 8, { width: 170 })
    .text(`PERÍODO: ${txtRango}`, MARGIN_LEFT + 325, y + 8, { width: 205, align: 'right' });

  // 3. INDICADORES CLAVE / RESUMEN EJECUTIVO (KPIS)
  y += 28;
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('1. RESUMEN EJECUTIVO DE VIGILANCIA MATERNA', MARGIN_LEFT, y);

  y += 14;
  const kpiWidth = (PAGE_WIDTH - 18) / 4;
  const resumen = datos.resumen || {};
  const totalGestantes = resumen.total_gestantes || 0;
  const totalEvaluaciones = resumen.total_evaluaciones || 0;
  const totalAro = resumen.total_aro || 0;
  const totalBajoRiesgo = resumen.total_bajo_riesgo || 0;
  const tasaAro = totalEvaluaciones > 0 ? ((totalAro / totalEvaluaciones) * 100).toFixed(1) : '0.0';

  const kpis = [
    { label: 'TOTAL GESTANTES', val: totalGestantes, color: '#0284c7', bg: '#f0f9ff' },
    { label: 'EVALUACIONES ARO', val: totalEvaluaciones, color: '#4f46e5', bg: '#eef2ff' },
    { label: 'CASOS ARO (ALTO RIESGO)', val: totalAro, color: '#dc2626', bg: '#fef2f2' },
    { label: 'TASA DEPARTAMENTAL ARO', val: `${tasaAro}%`, color: '#d97706', bg: '#fffbeb' }
  ];

  kpis.forEach((k, idx) => {
    const kx = MARGIN_LEFT + idx * (kpiWidth + 6);
    doc
      .rect(kx, y, kpiWidth, 42)
      .fillAndStroke(k.bg, '#cbd5e1');

    doc
      .fillColor(k.color)
      .font('Helvetica-Bold')
      .fontSize(13)
      .text(String(k.val), kx, y + 8, { align: 'center', width: kpiWidth });

    doc
      .fillColor('#475569')
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text(k.label, kx, y + 26, { align: 'center', width: kpiWidth });
  });

  // 4. DISTRIBUCIÓN POR MUNICIPIOS DE SUCHITEPEQUEZ
  y += 48;
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('2. DISTRIBUCIÓN TERRITORIAL Y CAPTACIÓN POR MUNICIPIO', MARGIN_LEFT, y);

  y += 14;
  // Tabla encabezado
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 16)
    .fill('#e2e8f0');

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(7)
    .text('MUNICIPIO', MARGIN_LEFT + 8, y + 5, { width: 190 })
    .text('TOTAL GESTANTES', MARGIN_LEFT + 210, y + 5, { width: 90, align: 'center' })
    .text('CASOS ARO', MARGIN_LEFT + 310, y + 5, { width: 80, align: 'center' })
    .text('% PREVALENCIA ARO', MARGIN_LEFT + 400, y + 5, { width: 130, align: 'center' });

  y += 16;
  const municipios = Array.isArray(datos.distribucion_municipios) && datos.distribucion_municipios.length > 0
    ? datos.distribucion_municipios
    : [
      { municipio: 'Mazatenango', total: totalGestantes || 0, total_aro: totalAro || 0 },
      { municipio: 'San Antonio Suchitepéquez', total: 0, total_aro: 0 },
      { municipio: 'Chicacao', total: 0, total_aro: 0 },
      { municipio: 'Cuyotenango', total: 0, total_aro: 0 },
      { municipio: 'Patulul', total: 0, total_aro: 0 }
    ];

  municipios.slice(0, 10).forEach((m, idx) => {
    const filaBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc
      .rect(MARGIN_LEFT, y, PAGE_WIDTH, 14)
      .fillAndStroke(filaBg, '#e2e8f0');

    const mTotal = parseInt(m.total || 0, 10);
    const mAro = parseInt(m.total_aro || 0, 10);
    const mPct = mTotal > 0 ? ((mAro / mTotal) * 100).toFixed(1) + '%' : '0.0%';

    doc
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(7)
      .text(m.municipio || 'Municipio', MARGIN_LEFT + 8, y + 3.5, { width: 190 });

    doc
      .font('Helvetica-Bold')
      .text(String(mTotal), MARGIN_LEFT + 210, y + 3.5, { width: 90, align: 'center' });

    doc
      .fillColor('#dc2626')
      .text(String(mAro), MARGIN_LEFT + 310, y + 3.5, { width: 80, align: 'center' });

    doc
      .fillColor('#1e293b')
      .text(mPct, MARGIN_LEFT + 400, y + 3.5, { width: 130, align: 'center' });

    y += 14;
  });

  // 5. FACTORES DE RIESGO DE MAYOR PREVALENCIA
  y += 10;
  doc
    .fillColor('#0f172a')
    .font('Helvetica-Bold')
    .fontSize(9)
    .text('3. PRINCIPALES FACTORES DE RIESGO IDENTIFICADOS (TOP 8)', MARGIN_LEFT, y);

  y += 14;
  doc
    .rect(MARGIN_LEFT, y, PAGE_WIDTH, 16)
    .fill('#e2e8f0');

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(7)
    .text('FACTOR / INDICADOR CLÍNICO NORMATIVO', MARGIN_LEFT + 8, y + 5, { width: 340 })
    .text('CASOS POSITIVOS', MARGIN_LEFT + 360, y + 5, { width: 80, align: 'center' })
    .text('PROPORCIÓN', MARGIN_LEFT + 450, y + 5, { width: 80, align: 'center' });

  y += 16;
  const factores = datos.factores_criticos || {};
  const listaFactoresReporte = [
    { nombre: 'Presión Arterial Elevada (PA ≥ 140/90 mmHg)', val: factores.presion_alta_actual || 0 },
    { nombre: 'Hemorragia en 2do / 3er Trimestre', val: factores.hemorragia_2do_3er_trim || 0 },
    { nombre: 'Adolescencia Temprana (Edad Gestacional < 20 años)', val: factores.edad_menor_20 || 0 },
    { nombre: 'Edad Materna Avanzada (Edad Gestacional ≥ 35 años)', val: factores.edad_mayor_35 || 0 },
    { nombre: 'Cesárea Previa', val: factores.cesarea_previa || 0 },
    { nombre: 'Diabetes Gestacional o Preexistente', val: factores.diabetes || 0 },
    { nombre: 'Infección del Tracto Urinario Recurrente', val: factores.infeccion_urinaria || 0 },
    { nombre: 'Desnutrición Materna (IMC < 18.5 kg/m²)', val: factores.desnutricion_imc_bajo || 0 }
  ];

  listaFactoresReporte.forEach((f, idx) => {
    const filaBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    doc
      .rect(MARGIN_LEFT, y, PAGE_WIDTH, 14)
      .fillAndStroke(filaBg, '#e2e8f0');

    const fVal = parseInt(f.val || 0, 10);
    const fPct = totalEvaluaciones > 0 ? ((fVal / totalEvaluaciones) * 100).toFixed(1) + '%' : '0.0%';

    doc
      .fillColor('#334155')
      .font('Helvetica')
      .fontSize(7)
      .text(f.nombre, MARGIN_LEFT + 8, y + 3.5, { width: 340 });

    doc
      .font('Helvetica-Bold')
      .fillColor(fVal > 0 ? '#dc2626' : '#64748b')
      .text(String(fVal), MARGIN_LEFT + 360, y + 3.5, { width: 80, align: 'center' });

    doc
      .fillColor('#1e293b')
      .text(fPct, MARGIN_LEFT + 450, y + 3.5, { width: 80, align: 'center' });

    y += 14;
  });

  // 6. FIRMAS INSTITUCIONALES DE VALIDACIÓN
  y += 16;
  const colFirma = (PAGE_WIDTH - 20) / 2;

  doc
    .rect(MARGIN_LEFT, y, colFirma, 56)
    .strokeColor('#94a3b8')
    .fillAndStroke('#ffffff', '#94a3b8');

  doc
    .rect(MARGIN_LEFT + colFirma + 20, y, colFirma, 56)
    .strokeColor('#94a3b8')
    .fillAndStroke('#ffffff', '#94a3b8');

  doc
    .fillColor('#1e293b')
    .font('Helvetica-Bold')
    .fontSize(7)
    .text('COORDINACIÓN EPIDEMIOLÓGICA DDRISS', MARGIN_LEFT + 8, y + 6, { width: colFirma - 16 })
    .text('DIRECCIÓN DEPARTAMENTAL DE SALUD', MARGIN_LEFT + colFirma + 28, y + 6, { width: colFirma - 16 });

  doc
    .font('Helvetica')
    .fontSize(6.5)
    .fillColor('#475569')
    .text('Firma y Sello: ____________________________________', MARGIN_LEFT + 8, y + 40)
    .text('Firma y Sello: ____________________________________', MARGIN_LEFT + colFirma + 28, y + 40);

  // PIE DE PÁGINA
  doc
    .fontSize(6.5)
    .font('Helvetica')
    .fillColor('#94a3b8')
    .text('Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS) de Suchitepéquez — SIREP MSPAS', MARGIN_LEFT, 742, { align: 'center', width: PAGE_WIDTH });

  doc.end();
};

