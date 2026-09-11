import os from 'os';
import { query } from '../config/db.js';
import {
  evaluarCriteriosARO,
  generarCodigoCorrelativo,
  INDICADORES_ARO
} from '../services/aroEvaluatorService.js';
import { generarBoletaReferenciaPDF, generarInformeGerencialPDF } from '../services/pdfReportService.js';
import { enviarBoletaPorEmail, enviarAlertaWhatsApp } from '../services/notificationService.js';

/**
 * Listar catálogo de los 25 indicadores normados
 * GET /api/fichas/indicadores
 */
export const listarIndicadoresARO = async (req, res) => {
  return res.status(200).json({
    success: true,
    total: INDICADORES_ARO.length,
    indicadores: INDICADORES_ARO
  });
};

/**
 * 1. Consultar Paciente por CUI / DPI
 * GET /api/pacientes/buscar/:cui
 */
export const buscarPacientePorCUI = async (req, res) => {
  try {
    const { cui } = req.params;

    if (!cui || cui.trim().length !== 13) {
      return res.status(400).json({
        success: false,
        message: 'El CUI/DPI debe contener exactamente 13 dígitos numéricos.'
      });
    }

    const result = await query(
      'SELECT * FROM pacientes WHERE cui_dpi = $1',
      [cui.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        existe: false,
        message: 'Paciente no encontrada con el CUI ingresado. Proceda con el registro.'
      });
    }

    const pac = result.rows[0];

    // Consultar historial de evaluaciones previas del expediente
    const fichasPrevias = await query(
      'SELECT id_ficha, fecha_registro, semanas_gestacion, es_aro, total_indicadores_activos FROM fichas_aro WHERE id_paciente = $1 ORDER BY id_ficha DESC',
      [pac.id_paciente]
    );

    return res.status(200).json({
      success: true,
      existe: true,
      total_evaluaciones_previas: fichasPrevias.rows.length,
      evaluaciones_previas: fichasPrevias.rows,
      paciente: {
        id_paciente: pac.id_paciente,
        cui_dpi: pac.cui_dpi || pac.dpi_cui,
        nombres: pac.nombres,
        apellidos: pac.apellidos,
        fecha_nacimiento: pac.fecha_nacimiento,
        telefono: pac.telefono,
        direccion: pac.direccion,
        municipio: pac.municipio || pac.direccion || null,
        comunidad: pac.comunidad || '',
        gestas_previas: pac.gestas_previas || 0,
        partos_previos: pac.partos_previos || 0,
        cesareas_previas: pac.cesareas_previas || 0,
        abortos_previos: pac.abortos_previos || 0
      }
    });

  } catch (error) {
    console.error('Error al buscar paciente en BD:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al consultar la paciente en la base de datos.'
    });
  }
};

/**
 * 2. Registrar Nueva Paciente
 * POST /api/pacientes
 */
export const registrarPaciente = async (req, res) => {
  try {
    const {
      cui_dpi,
      nombres,
      apellidos,
      fecha_nacimiento,
      telefono,
      direccion,
      municipio,
      comunidad,
      gestas_previas,
      partos_previos,
      cesareas_previas,
      abortos_previos
    } = req.body;

    if (!cui_dpi || !nombres || !apellidos || !fecha_nacimiento || !municipio) {
      return res.status(400).json({
        success: false,
        message: 'Los campos CUI (13 dígitos), Nombres, Apellidos, Fecha de Nacimiento y Municipio son obligatorios.'
      });
    }

    const insertQuery = `
      INSERT INTO pacientes (
        cui_dpi, nombres, apellidos, fecha_nacimiento, telefono,
        direccion, municipio, comunidad, gestas_previas, partos_previos,
        cesareas_previas, abortos_previos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    const values = [
      cui_dpi.trim(),
      nombres.trim(),
      apellidos.trim(),
      fecha_nacimiento,
      telefono || null,
      direccion || '',
      municipio,
      comunidad || '',
      parseInt(gestas_previas, 10) || 0,
      parseInt(partos_previos, 10) || 0,
      parseInt(cesareas_previas, 10) || 0,
      parseInt(abortos_previos, 10) || 0
    ];

    const result = await query(insertQuery, values);

    return res.status(201).json({
      success: true,
      message: 'Paciente registrada exitosamente en la base de datos de SIREP_MSPAS.',
      paciente: result.rows[0]
    });

  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe una paciente registrada con este CUI/DPI en la base de datos.'
      });
    }
    console.error('Error al registrar paciente en BD:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al procesar el registro de la paciente en la base de datos.'
    });
  }
};

/**
 * 2.1 Actualizar Datos / Antecedentes de Paciente Existente (Retorno al cabo del tiempo)
 * PUT /api/pacientes/:id
 */
export const actualizarPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      telefono,
      direccion,
      municipio,
      comunidad,
      gestas_previas,
      partos_previos,
      cesareas_previas,
      abortos_previos
    } = req.body;

    const updateQuery = `
      UPDATE pacientes SET
        telefono = COALESCE($1, telefono),
        direccion = COALESCE($2, direccion),
        municipio = COALESCE($3, municipio),
        comunidad = COALESCE($4, comunidad),
        gestas_previas = COALESCE($5, gestas_previas),
        partos_previos = COALESCE($6, partos_previos),
        cesareas_previas = COALESCE($7, cesareas_previas),
        abortos_previos = COALESCE($8, abortos_previos)
      WHERE id_paciente = $9
      RETURNING *;
    `;

    const values = [
      telefono !== undefined ? telefono : null,
      direccion !== undefined ? direccion : null,
      municipio !== undefined ? municipio : null,
      comunidad !== undefined ? comunidad : null,
      gestas_previas !== undefined ? parseInt(gestas_previas, 10) : null,
      partos_previos !== undefined ? parseInt(partos_previos, 10) : null,
      cesareas_previas !== undefined ? parseInt(cesareas_previas, 10) : null,
      abortos_previos !== undefined ? parseInt(abortos_previos, 10) : null,
      id
    ];

    const result = await query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Expediente de paciente no encontrado.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Expediente de paciente actualizado exitosamente.',
      paciente: result.rows[0]
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    return res.status(500).json({ success: false, message: 'Error interno al actualizar el expediente.' });
  }
};

/**
 * 2.2 Obtener Historial Longitudinal de Evaluaciones de una Paciente
 * GET /api/pacientes/:id/historial
 */
export const obtenerHistorialPaciente = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT f.*, p.nombres, p.apellidos, p.cui_dpi, p.municipio
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      WHERE f.id_paciente = $1
      ORDER BY f.id_ficha DESC
    `, [id]);

    return res.status(200).json({
      success: true,
      total: result.rows.length,
      historial: result.rows
    });
  } catch (error) {
    console.error('Error al obtener historial longitudinal:', error);
    return res.status(500).json({ success: false, message: 'Error al consultar historial del expediente.' });
  }
};

/**
 * 3. Evaluar Ficha ARO y Generar Boleta de Referencia
 * POST /api/fichas/evaluar (y POST /api/fichas-aro)
 */
export const evaluarYGuardarFicha = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado. Debe iniciar sesión.'
      });
    }

    const id_usuario = req.user.id || req.user.id_usuario;

    const {
      id_paciente,
      semanas_gestacion,
      peso_kg,
      talla_cm,
      presion_sistolica,
      presion_diastolica,
      frecuencia_cardiaca_fetal,
      indicadores = {},
      observaciones_clinicas = '',
      via_captura = 'WEB'
    } = req.body;

    if (!id_paciente || !semanas_gestacion || !presion_sistolica || !presion_diastolica) {
      return res.status(400).json({
        success: false,
        message: 'Faltan parámetros biométricos obligatorios para la evaluación prenatal.'
      });
    }

    // 1. Evaluación Algorítmica con el motor epidemiológico
    const evaluacion = evaluarCriteriosARO(
      { semanas_gestacion, peso_kg, talla_cm, presion_sistolica, presion_diastolica },
      indicadores
    );

    const {
      es_aro,
      total_indicadores_activos,
      indicadores_positivos,
      imc,
      estado_nutricional,
      nivel_urgencia,
      clasificacion
    } = evaluacion;

    // Generar código correlativo si es ARO
    const codigo_correlativo = es_aro ? generarCodigoCorrelativo() : null;

    // Inserción en la base de datos (PostgreSQL)
    const insertFicha = `
      INSERT INTO fichas_aro (
        id_paciente, id_usuario, semanas_gestacion, peso_kg, talla_cm, imc, estado_nutricional,
        presion_sistolica, presion_diastolica, frecuencia_cardiaca_fetal,
        ind_01_edad_menor_20, ind_02_edad_mayor_35, ind_03_abortos_recurrentes,
        ind_04_muerte_fetal_previa, ind_05_parto_prematuro_previo, ind_06_cesarea_previa,
        ind_07_periodo_intergenesico_corto, ind_08_gran_multipara, ind_09_hta_cronica,
        ind_10_diabetes, ind_11_presion_alta_actual, ind_12_hemorragia_1er_trim,
        ind_13_hemorragia_2do_3er_trim, ind_14_embarazo_multiple, ind_15_presentacion_no_cefalica,
        ind_16_ruptura_membranas, ind_17_infeccion_urinaria, ind_18_its_vih,
        ind_19_talla_baja, ind_20_desnutricion_imc_bajo, ind_21_obesidad_imc_alto,
        ind_22_anemia, ind_23_cardiopatia_nefropatia, ind_24_sin_control_prenatal,
        ind_25_vulnerabilidad_violencia, es_aro, total_indicadores_activos,
        observaciones_clinicas, via_captura
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
        $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
        $31, $32, $33, $34, $35, $36, $37, $38, $39
      ) RETURNING *;
    `;

    const values = [
      id_paciente, id_usuario, parseInt(semanas_gestacion, 10),
      peso_kg ? parseFloat(peso_kg) : null,
      talla_cm ? parseFloat(talla_cm) : null,
      imc,
      estado_nutricional || 'NO_EVALUADO',
      parseInt(presion_sistolica, 10),
      parseInt(presion_diastolica, 10),
      frecuencia_cardiaca_fetal ? parseInt(frecuencia_cardiaca_fetal, 10) : null,
      Boolean(indicadores.ind_01), Boolean(indicadores.ind_02), Boolean(indicadores.ind_03),
      Boolean(indicadores.ind_04), Boolean(indicadores.ind_05), Boolean(indicadores.ind_06),
      Boolean(indicadores.ind_07), Boolean(indicadores.ind_08), Boolean(indicadores.ind_09),
      Boolean(indicadores.ind_10), Boolean(indicadores.ind_11), Boolean(indicadores.ind_12),
      Boolean(indicadores.ind_13), Boolean(indicadores.ind_14), Boolean(indicadores.ind_15),
      Boolean(indicadores.ind_16), Boolean(indicadores.ind_17), Boolean(indicadores.ind_18),
      Boolean(indicadores.ind_19), Boolean(indicadores.ind_20), Boolean(indicadores.ind_21),
      Boolean(indicadores.ind_22), Boolean(indicadores.ind_23), Boolean(indicadores.ind_24),
      Boolean(indicadores.ind_25), es_aro, total_indicadores_activos,
      observaciones_clinicas,
      via_captura === 'MÓVIL' ? 'MÓVIL' : 'WEB'
    ];

    const resultFicha = await query(insertFicha, values);
    const fichaGuardada = resultFicha.rows[0];

    let boletaGenerada = null;
    if (es_aro) {
      boletaGenerada = {
        codigo_correlativo,
        id_ficha: fichaGuardada.id_ficha,
        establecimiento_destino: 'Hospital Nacional de Mazatenango',
        nivel_urgencia,
        fecha_emision: new Date().toISOString(),
        estado_whatsapp: 'EN_COLA',
        estado_email: 'EN_COLA',
        ruta_pdf: `/reports/boletas/${codigo_correlativo}.pdf`
      };
    }

    return res.status(201).json({
      success: true,
      message: es_aro
        ? `Evaluación registrada. Clasificación: Alto Riesgo Obstétrico (ARO). Boleta ${codigo_correlativo} generada para referencia.`
        : 'Evaluación registrada exitosamente. Clasificación: Embarazo de Bajo Riesgo.',
      es_aro,
      clasificacion,
      nivel_urgencia,
      total_indicadores_activos,
      indicadores_positivos,
      imc,
      estado_nutricional,
      codigo_correlativo,
      id_ficha: fichaGuardada.id_ficha,
      ficha: fichaGuardada,
      boleta: boletaGenerada
    });

  } catch (error) {
    console.error('Error al guardar ficha ARO en BD:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la evaluación prenatal en la base de datos.'
    });
  }
};

/**
 * 4. Listar Pacientes Registradas
 * GET /api/pacientes
 */
export const listarPacientes = async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM pacientes ORDER BY id_paciente DESC LIMIT 50'
    );
    return res.status(200).json({
      success: true,
      total: result.rows.length,
      pacientes: result.rows
    });
  } catch (error) {
    console.error('Error al listar pacientes:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el listado de pacientes.'
    });
  }
};

/**
 * 5. Obtener Historial de Evaluaciones y Boletas
 * GET /api/fichas/historial
 */
export const obtenerHistorialFichas = async (req, res) => {
  try {
    const result = await query(`
      SELECT f.*, p.nombres, p.apellidos, p.cui_dpi, p.municipio, p.telefono
      FROM fichas_aro f
      LEFT JOIN pacientes p ON f.id_paciente = p.id_paciente
      ORDER BY f.id_ficha DESC
      LIMIT 100
    `);
    return res.status(200).json({
      success: true,
      total: result.rows.length,
      fichas: result.rows
    });
  } catch (error) {
    console.error('Error al obtener historial de fichas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de evaluaciones.'
    });
  }
};

/**
 * Helper para construir filtros de Municipio y Rango de Fechas
 */
const construirFiltrosDashboard = (queryObj) => {
  const { municipio, fecha_inicio, fecha_fin } = queryObj;
  const condiciones = [];
  const params = [];
  let idx = 1;

  if (municipio && municipio !== 'TODOS') {
    condiciones.push(`p.municipio = $${idx}`);
    params.push(municipio.trim());
    idx++;
  }

  if (fecha_inicio) {
    condiciones.push(`f.fecha_registro >= $${idx}::date`);
    params.push(fecha_inicio);
    idx++;
  }

  if (fecha_fin) {
    condiciones.push(`f.fecha_registro <= ($${idx}::date + INTERVAL '1 day')`);
    params.push(fecha_fin);
    idx++;
  }

  const whereClausula = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
  return { whereClausula, params, municipio, fecha_inicio, fecha_fin };
};

/**
 * 6. Estadísticas para Tablero Gerencial (Dashboard DDRISS) con filtros de Municipio y Fechas
 * GET /api/dashboard/estadisticas
 */
export const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const { whereClausula, params, municipio, fecha_inicio, fecha_fin } = construirFiltrosDashboard(req.query);

    // Gestantes registradas (filtradas por municipio si aplica)
    let wherePacientes = '';
    let paramsPacientes = [];
    if (municipio && municipio !== 'TODOS') {
      wherePacientes = 'WHERE municipio = $1';
      paramsPacientes = [municipio.trim()];
    }
    const totalPacientesRes = await query(`SELECT COUNT(*) AS total FROM pacientes ${wherePacientes}`, paramsPacientes);

    // Total de evaluaciones filtradas
    const totalFichasRes = await query(`
      SELECT COUNT(f.id_ficha) AS total
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereClausula}
    `, params);

    // Casos ARO y Bajo Riesgo filtrados
    const whereAro = whereClausula ? `${whereClausula} AND f.es_aro = TRUE` : 'WHERE f.es_aro = TRUE';
    const whereBajoRiesgo = whereClausula ? `${whereClausula} AND f.es_aro = FALSE` : 'WHERE f.es_aro = FALSE';

    const totalAroRes = await query(`
      SELECT COUNT(f.id_ficha) AS total
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereAro}
    `, params);

    const totalBajoRiesgoRes = await query(`
      SELECT COUNT(f.id_ficha) AS total
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereBajoRiesgo}
    `, params);

    // Factores críticos filtrados
    const factoresRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE f.ind_01_edad_menor_20 = TRUE) AS adolescentes,
        COUNT(*) FILTER (WHERE f.ind_02_edad_mayor_35 = TRUE) AS edad_avanzada,
        COUNT(*) FILTER (WHERE f.ind_03_abortos_recurrentes = TRUE) AS abortos_recurrentes,
        COUNT(*) FILTER (WHERE f.ind_06_cesarea_previa = TRUE) AS cesarea_previa,
        COUNT(*) FILTER (WHERE f.ind_07_periodo_intergenesico_corto = TRUE) AS periodo_corto,
        COUNT(*) FILTER (WHERE f.ind_08_gran_multipara = TRUE) AS gran_multipara,
        COUNT(*) FILTER (WHERE f.ind_09_hta_cronica = TRUE OR f.ind_11_presion_alta_actual = TRUE) AS hipertension,
        COUNT(*) FILTER (WHERE f.ind_10_diabetes = TRUE) AS diabetes,
        COUNT(*) FILTER (WHERE f.ind_11_presion_alta_actual = TRUE) AS presion_alta_actual,
        COUNT(*) FILTER (WHERE f.ind_12_hemorragia_1er_trim = TRUE OR f.ind_13_hemorragia_2do_3er_trim = TRUE) AS hemorragias,
        COUNT(*) FILTER (WHERE f.ind_13_hemorragia_2do_3er_trim = TRUE) AS hemorragia_2do_3er_trim,
        COUNT(*) FILTER (WHERE f.ind_16_ruptura_membranas = TRUE) AS ruptura_membranas,
        COUNT(*) FILTER (WHERE f.ind_17_infeccion_urinaria = TRUE) AS itu,
        COUNT(*) FILTER (WHERE f.ind_19_talla_baja = TRUE) AS talla_baja,
        COUNT(*) FILTER (WHERE f.ind_20_desnutricion_imc_bajo = TRUE) AS desnutricion,
        COUNT(*) FILTER (WHERE f.ind_21_obesidad_imc_alto = TRUE) AS obesidad,
        COUNT(*) FILTER (WHERE f.ind_22_anemia = TRUE) AS anemia,
        COUNT(*) FILTER (WHERE f.ind_24_sin_control_prenatal = TRUE) AS sin_control_oportuno,
        COUNT(*) FILTER (WHERE f.ind_25_vulnerabilidad_violencia = TRUE) AS vulnerabilidad_violencia
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereClausula}
    `, params);

    // Distribución territorial por municipio
    const municipiosRes = await query(`
      SELECT p.municipio, COUNT(f.id_ficha) AS total_evaluaciones,
             COUNT(f.id_ficha) FILTER (WHERE f.es_aro = TRUE) AS total_aro,
             COUNT(f.id_ficha) FILTER (WHERE f.es_aro = FALSE) AS total_bajo_riesgo
      FROM pacientes p
      LEFT JOIN fichas_aro f ON p.id_paciente = f.id_paciente
      ${whereClausula}
      WHERE p.municipio IS NOT NULL AND p.municipio != ''
      GROUP BY p.municipio
      ORDER BY total_evaluaciones DESC
    `, params);

    // Distribución Nutricional Materna
    const whereNutricion = whereClausula ? `${whereClausula} AND f.imc IS NOT NULL` : 'WHERE f.imc IS NOT NULL';
    const nutricionRes = await query(`
      SELECT
        COUNT(*) FILTER (WHERE f.imc < 18.5) AS desnutricion,
        COUNT(*) FILTER (WHERE f.imc >= 18.5 AND f.imc < 25.0) AS normal,
        COUNT(*) FILTER (WHERE f.imc >= 25.0 AND f.imc < 30.0) AS sobrepeso,
        COUNT(*) FILTER (WHERE f.imc >= 30.0) AS obesidad
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereNutricion}
    `, params);

    // Distribución de Urgencia
    const urgenciaRes = await query(`
      SELECT
        COUNT(*) FILTER (WHERE f.presion_sistolica >= 160 OR f.presion_diastolica >= 110 OR f.ind_12_hemorragia_1er_trim = TRUE OR f.ind_13_hemorragia_2do_3er_trim = TRUE OR f.ind_16_ruptura_membranas = TRUE) AS emergencia_inmediata,
        COUNT(*) FILTER (WHERE f.es_aro = TRUE AND (f.presion_sistolica < 160 AND f.presion_diastolica < 110 AND f.ind_12_hemorragia_1er_trim = FALSE AND f.ind_13_hemorragia_2do_3er_trim = FALSE AND f.ind_16_ruptura_membranas = FALSE)) AS alto_riesgo_moderado
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereClausula}
    `, params);

    // Últimas evaluaciones filtradas
    const ultimasAlertasRes = await query(`
      SELECT f.id_ficha, f.es_aro, f.presion_sistolica, f.presion_diastolica,
             f.semanas_gestacion, f.total_indicadores_activos, f.fecha_registro,
             p.nombres, p.apellidos, p.cui_dpi, p.municipio
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereClausula}
      ORDER BY f.id_ficha DESC
      LIMIT 6
    `, params);

    return res.status(200).json({
      success: true,
      filtros_aplicados: { municipio: municipio || 'TODOS', fecha_inicio: fecha_inicio || null, fecha_fin: fecha_fin || null },
      resumen: {
        total_gestantes: parseInt(totalPacientesRes.rows[0]?.total || 0, 10),
        total_evaluaciones: parseInt(totalFichasRes.rows[0]?.total || 0, 10),
        total_aro: parseInt(totalAroRes.rows[0]?.total || 0, 10),
        total_bajo_riesgo: parseInt(totalBajoRiesgoRes.rows[0]?.total || 0, 10)
      },
      factores_criticos: factoresRes.rows[0] || {},
      distribucion_municipios: municipiosRes.rows || [],
      distribucion_nutricional: nutricionRes.rows[0] || {},
      niveles_urgencia: urgenciaRes.rows[0] || {},
      ultimas_alertas: ultimasAlertasRes.rows || []
    });
  } catch (error) {
    console.error('Error al generar estadísticas de dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al calcular las métricas epidemiológicas.'
    });
  }
};

/**
 * 7. Descargar Boleta Oficial de Referencia en PDF
 * GET /api/fichas/boleta/:id/pdf
 */
export const descargarBoletaPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query(`
      SELECT f.*, p.nombres, p.apellidos, p.cui_dpi, p.municipio, p.comunidad, p.direccion, p.telefono,
             p.gestas_previas, p.partos_previos, p.cesareas_previas, p.abortos_previos
      FROM fichas_aro f
      LEFT JOIN pacientes p ON f.id_paciente = p.id_paciente
      WHERE f.id_ficha = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ficha epidemiológica no encontrada en la base de datos.'
      });
    }

    const ficha = result.rows[0];
    generarBoletaReferenciaPDF(ficha, res);

  } catch (error) {
    console.error('Error al emitir boleta PDF:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al generar el documento PDF.'
    });
  }
};

/**
 * 8. Despachar Alerta por Correo Electrónico (SMTP)
 * POST /api/fichas/boleta/:id/enviar-email
 */
export const despacharAlertaEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const result = await query(`
      SELECT f.*, p.nombres, p.apellidos, p.cui_dpi, p.municipio, p.comunidad, p.direccion, p.telefono
      FROM fichas_aro f
      LEFT JOIN pacientes p ON f.id_paciente = p.id_paciente
      WHERE f.id_ficha = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
    }

    const ficha = result.rows[0];
    const resultadoEnvio = await enviarBoletaPorEmail(ficha, email);

    return res.status(200).json({
      success: resultadoEnvio.success,
      message: resultadoEnvio.mensaje,
      detalle: resultadoEnvio
    });

  } catch (error) {
    console.error('Error en controlador despacharAlertaEmail:', error);
    return res.status(500).json({ success: false, message: 'Error al despachar el correo.' });
  }
};

/**
 * 9. Despachar Alerta por WhatsApp
 * POST /api/fichas/boleta/:id/enviar-whatsapp
 */
export const despacharAlertaWhatsApp = async (req, res) => {
  try {
    const { id } = req.params;
    const { telefono } = req.body;

    const result = await query(`
      SELECT f.*, p.nombres, p.apellidos, p.cui_dpi, p.municipio, p.comunidad, p.direccion, p.telefono
      FROM fichas_aro f
      LEFT JOIN pacientes p ON f.id_paciente = p.id_paciente
      WHERE f.id_ficha = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ficha no encontrada.' });
    }

    const ficha = result.rows[0];
    const resultadoEnvio = await enviarAlertaWhatsApp(ficha, telefono);

    return res.status(200).json({
      success: resultadoEnvio.success,
      message: resultadoEnvio.mensaje,
      linkWhatsApp: resultadoEnvio.linkWhatsApp,
      detalle: resultadoEnvio
    });

  } catch (error) {
    console.error('Error en controlador despacharAlertaWhatsApp:', error);
    return res.status(500).json({ success: false, message: 'Error al procesar la alerta de WhatsApp.' });
  }
};

/**
 * 10. Descargar Informe Epidemiológico Gerencial en PDF con Filtros de Municipio y Rango de Fechas
 * GET /api/dashboard/informe-pdf
 */
export const descargarInformeGerencialPDF = async (req, res) => {
  try {
    const { whereClausula, params, municipio, fecha_inicio, fecha_fin } = construirFiltrosDashboard(req.query);

    let wherePacientes = '';
    let paramsPacientes = [];
    if (municipio && municipio !== 'TODOS') {
      wherePacientes = 'WHERE municipio = $1';
      paramsPacientes = [municipio.trim()];
    }
    const totalPacientesRes = await query(`SELECT COUNT(*) AS total FROM pacientes ${wherePacientes}`, paramsPacientes);

    const totalFichasRes = await query(`
      SELECT COUNT(f.id_ficha) AS total
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereClausula}
    `, params);

    const whereAro = whereClausula ? `${whereClausula} AND f.es_aro = TRUE` : 'WHERE f.es_aro = TRUE';
    const whereBajoRiesgo = whereClausula ? `${whereClausula} AND f.es_aro = FALSE` : 'WHERE f.es_aro = FALSE';

    const totalAroRes = await query(`
      SELECT COUNT(f.id_ficha) AS total
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereAro}
    `, params);

    const totalBajoRiesgoRes = await query(`
      SELECT COUNT(f.id_ficha) AS total
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereBajoRiesgo}
    `, params);

    const factoresRes = await query(`
      SELECT 
        COUNT(*) FILTER (WHERE f.ind_01_edad_menor_20 = TRUE) AS edad_menor_20,
        COUNT(*) FILTER (WHERE f.ind_02_edad_mayor_35 = TRUE) AS edad_mayor_35,
        COUNT(*) FILTER (WHERE f.ind_03_abortos_recurrentes = TRUE) AS abortos_recurrentes,
        COUNT(*) FILTER (WHERE f.ind_06_cesarea_previa = TRUE) AS cesarea_previa,
        COUNT(*) FILTER (WHERE f.ind_07_periodo_intergenesico_corto = TRUE) AS periodo_corto,
        COUNT(*) FILTER (WHERE f.ind_08_gran_multipara = TRUE) AS gran_multipara,
        COUNT(*) FILTER (WHERE f.ind_09_hta_cronica = TRUE OR f.ind_11_presion_alta_actual = TRUE) AS hipertension,
        COUNT(*) FILTER (WHERE f.ind_10_diabetes = TRUE) AS diabetes,
        COUNT(*) FILTER (WHERE f.ind_11_presion_alta_actual = TRUE) AS presion_alta_actual,
        COUNT(*) FILTER (WHERE f.ind_12_hemorragia_1er_trim = TRUE OR f.ind_13_hemorragia_2do_3er_trim = TRUE) AS hemorragias,
        COUNT(*) FILTER (WHERE f.ind_13_hemorragia_2do_3er_trim = TRUE) AS hemorragia_2do_3er_trim,
        COUNT(*) FILTER (WHERE f.ind_16_ruptura_membranas = TRUE) AS ruptura_membranas,
        COUNT(*) FILTER (WHERE f.ind_17_infeccion_urinaria = TRUE) AS infeccion_urinaria,
        COUNT(*) FILTER (WHERE f.ind_19_talla_baja = TRUE) AS talla_baja,
        COUNT(*) FILTER (WHERE f.ind_20_desnutricion_imc_bajo = TRUE) AS desnutricion_imc_bajo,
        COUNT(*) FILTER (WHERE f.ind_21_obesidad_imc_alto = TRUE) AS obesidad,
        COUNT(*) FILTER (WHERE f.ind_22_anemia = TRUE) AS anemia,
        COUNT(*) FILTER (WHERE f.ind_24_sin_control_prenatal = TRUE) AS sin_control_oportuno,
        COUNT(*) FILTER (WHERE f.ind_25_vulnerabilidad_violencia = TRUE) AS vulnerabilidad_violencia
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereClausula}
    `, params);

    const municipiosRes = await query(`
      SELECT p.municipio, COUNT(f.id_ficha) AS total,
             COUNT(f.id_ficha) FILTER (WHERE f.es_aro = TRUE) AS total_aro,
             COUNT(f.id_ficha) FILTER (WHERE f.es_aro = FALSE) AS total_bajo_riesgo
      FROM pacientes p
      LEFT JOIN fichas_aro f ON p.id_paciente = f.id_paciente
      ${whereClausula}
      WHERE p.municipio IS NOT NULL AND p.municipio != ''
      GROUP BY p.municipio
      ORDER BY total DESC
    `, params);

    const whereNutricion = whereClausula ? `${whereClausula} AND f.imc IS NOT NULL` : 'WHERE f.imc IS NOT NULL';
    const nutricionRes = await query(`
      SELECT
        COUNT(*) FILTER (WHERE f.imc < 18.5) AS desnutricion,
        COUNT(*) FILTER (WHERE f.imc >= 18.5 AND f.imc < 25.0) AS normal,
        COUNT(*) FILTER (WHERE f.imc >= 25.0 AND f.imc < 30.0) AS sobrepeso,
        COUNT(*) FILTER (WHERE f.imc >= 30.0) AS obesidad
      FROM fichas_aro f
      JOIN pacientes p ON f.id_paciente = p.id_paciente
      ${whereNutricion}
    `, params);

    const datosDashboard = {
      filtros: {
        municipio: municipio || 'TODOS',
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null
      },
      resumen: {
        total_gestantes: parseInt(totalPacientesRes.rows[0]?.total || 0, 10),
        total_evaluaciones: parseInt(totalFichasRes.rows[0]?.total || 0, 10),
        total_aro: parseInt(totalAroRes.rows[0]?.total || 0, 10),
        total_bajo_riesgo: parseInt(totalBajoRiesgoRes.rows[0]?.total || 0, 10)
      },
      factores_criticos: factoresRes.rows[0] || {},
      distribucion_municipios: municipiosRes.rows || [],
      distribucion_nutricional: nutricionRes.rows[0] || {}
    };

    return generarInformeGerencialPDF(datosDashboard, res);

  } catch (error) {
    console.error('Error al generar PDF de informe gerencial:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al generar el documento PDF del informe gerencial.'
    });
  }
};

// =======================================================
// 11. Sincronización de Sesión y Borrador Móvil por QR
// =======================================================

const borradoresMoviles = new Map();

// Limpieza periódica cada 10 minutos
setInterval(() => {
  const ahora = Date.now();
  for (const [token, item] of borradoresMoviles.entries()) {
    if (ahora > item.expiracion) {
      borradoresMoviles.delete(token);
    }
  }
}, 10 * 60 * 1000);

function obtenerIpLocalRed() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          if (iface.address.startsWith('192.168.1.') || iface.address.startsWith('192.168.0.') || iface.address.startsWith('10.')) {
            return iface.address;
          }
        }
      }
    }
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (e) {
    console.warn('Error al detectar IP local:', e);
  }
  return 'localhost';
}

/**
 * Guardar borrador temporal para transferir al teléfono por QR
 * POST /api/fichas/borrador-movil
 */
export const guardarBorradorMovil = async (req, res) => {
  try {
    const { paciente, evaluacion } = req.body;
    if (!paciente || !paciente.id_paciente) {
      return res.status(400).json({
        success: false,
        message: 'Datos de la paciente requeridos para generar el borrador móvil.'
      });
    }

    const authHeader = req.headers.authorization || '';
    const jwtToken = authHeader.replace(/^Bearer\s+/i, '');

    const token = `m_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    borradoresMoviles.set(token, {
      paciente,
      evaluacion: evaluacion || {},
      jwtToken,
      usuario: req.user || null,
      creadoPor: req.user ? (req.user.id || req.user.id_usuario) : null,
      expiracion: Date.now() + 2 * 60 * 60 * 1000 // 2 horas de validez
    });

    const ipSugerida = obtenerIpLocalRed();

    return res.status(200).json({
      success: true,
      token,
      ipSugerida,
      message: 'Borrador para sincronización móvil generado exitosamente.'
    });
  } catch (error) {
    console.error('Error al guardar borrador móvil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno al generar la sesión móvil.'
    });
  }
};

/**
 * Obtener borrador temporal para continuar llenado en teléfono
 * GET /api/fichas/borrador-movil/:token
 */
export const obtenerBorradorMovil = async (req, res) => {
  try {
    const { token } = req.params;
    const borrador = borradoresMoviles.get(token);

    if (!borrador) {
      return res.status(404).json({
        success: false,
        message: 'El código QR o enlace móvil ha expirado o no es válido.'
      });
    }

    return res.status(200).json({
      success: true,
      paciente: borrador.paciente,
      evaluacion: borrador.evaluacion,
      jwtToken: borrador.jwtToken,
      usuario: borrador.usuario
    });
  } catch (error) {
    console.error('Error al obtener borrador móvil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al recuperar los datos del borrador móvil.'
    });
  }
};