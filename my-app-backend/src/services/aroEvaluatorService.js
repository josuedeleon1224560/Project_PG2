/**
 * Servicio de Evaluación Epidemiológica de Alto Riesgo Obstétrico (ARO)
 * Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS) de Suchitepéquez - MSPAS
 */

export const INDICADORES_ARO = [
  // CATEGORÍA I: Antecedentes Gineco-Obstétricos (ind_01 a ind_08)
  { id: 'ind_01', num: 1, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Edad menor de 20 años (<20)' },
  { id: 'ind_02', num: 2, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Edad mayor o igual a 35 años (≥35)' },
  { id: 'ind_03', num: 3, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Antecedente de ≥3 abortos espontáneos o inducidos' },
  { id: 'ind_04', num: 4, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Muerte fetal o neonatal previa documentada' },
  { id: 'ind_05', num: 5, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Parto prematuro previo (<37 sem) o bajo peso al nacer (<2500g)' },
  { id: 'ind_06', num: 6, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Cesárea previa o cirugía uterina previa' },
  { id: 'ind_07', num: 7, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Periodo intergenésico corto (< 2 años)' },
  { id: 'ind_08', num: 8, cat: 'I', catNombre: 'Antecedentes Gineco-Obstétricos', label: 'Gran multípara (≥4 partos vaginales o cesáreas previas)' },

  // CATEGORÍA II: Patologías y Complicaciones Actuales (ind_09 a ind_18)
  { id: 'ind_09', num: 9, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Hipertensión arterial crónica diagnosticada' },
  { id: 'ind_10', num: 10, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Diabetes pregestacional o gestacional' },
  { id: 'ind_11', num: 11, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Presión arterial actual ≥ 140/90 mmHg (Trastorno Hipertensivo)' },
  { id: 'ind_12', num: 12, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Hemorragia transvaginal en 1er trimestre' },
  { id: 'ind_13', num: 13, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Hemorragia transvaginal en 2do o 3er trimestre' },
  { id: 'ind_14', num: 14, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Embarazo múltiple confirmado por USG/clínica' },
  { id: 'ind_15', num: 15, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Presentación no cefálica (pelviana/transversa >36 sem)' },
  { id: 'ind_16', num: 16, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Ruptura prematura de membranas (RPM) ovulares' },
  { id: 'ind_17', num: 17, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Infección del tracto urinario (ITU) recurrente' },
  { id: 'ind_18', num: 18, cat: 'II', catNombre: 'Patologías y Complicaciones Actuales', label: 'Infección de transmisión sexual activa o VIH positivo' },

  // CATEGORÍA III: Estado Nutricional y Biopsicosocial (ind_19 a ind_25)
  { id: 'ind_19', num: 19, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Talla baja materna (< 145 cm)' },
  { id: 'ind_20', num: 20, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Desnutrición materna (IMC pregestacional/actual < 18.5)' },
  { id: 'ind_21', num: 21, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Obesidad materna tipo I/II/III (IMC ≥ 30.0)' },
  { id: 'ind_22', num: 22, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Anemia clínica o de laboratorio (Hb < 11.0 g/dL)' },
  { id: 'ind_23', num: 23, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Cardiopatía, nefropatía u otra comorbilidad crónica grave' },
  { id: 'ind_24', num: 24, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Sin control prenatal oportuno en 1er o 2do trimestre' },
  { id: 'ind_25', num: 25, cat: 'III', catNombre: 'Estado Nutricional y Biopsicosocial', label: 'Vulnerabilidad extrema, violencia intrafamiliar o exclusión' },
];

/**
 * Calcula el IMC y clasifica el estado nutricional
 */
export function calcularIMC(pesoKg, tallaCm) {
  if (!pesoKg || !tallaCm || tallaCm <= 0) {
    return { imc: null, estado_nutricional: 'NO_EVALUADO' };
  }
  const tallaM = tallaCm / 100;
  const imc = parseFloat((pesoKg / (tallaM * tallaM)).toFixed(2));

  let estado_nutricional = 'NORMAL';
  if (imc < 18.5) estado_nutricional = 'DESNUTRICION';
  else if (imc >= 18.5 && imc <= 24.9) estado_nutricional = 'NORMAL';
  else if (imc >= 25.0 && imc <= 29.9) estado_nutricional = 'SOBREPESO';
  else if (imc >= 30.0) estado_nutricional = 'OBESIDAD';

  return { imc, estado_nutricional };
}

/**
 * Genera código correlativo oficial para la boleta de referencia
 * Formato: REF-SUCH-YYYY-XXXXX
 */
export function generarCodigoCorrelativo(idReferencia = 1) {
  const anio = new Date().getFullYear();
  const aleatorioSecuencia = String(idReferencia || Math.floor(1000 + Math.random() * 9000)).padStart(5, '0');
  return `REF-SUCH-${anio}-${aleatorioSecuencia}`;
}

/**
 * Evalúa los criterios epidemiológicos de ARO según norma MSPAS
 */
export function evaluarCriteriosARO(datosClinicos = {}, indicadores = {}) {
  const {
    semanas_gestacion,
    peso_kg,
    talla_cm,
    presion_sistolica,
    presion_diastolica
  } = datosClinicos;

  const { imc, estado_nutricional } = calcularIMC(peso_kg, talla_cm);

  // Copia normalizada de indicadores
  const indicadoresEvaluados = {};
  const indicadoresPositivos = [];

  INDICADORES_ARO.forEach((item) => {
    const valor = Boolean(indicadores[item.id]);
    indicadoresEvaluados[item.id] = valor;
    if (valor) {
      indicadoresPositivos.push({
        id: item.id,
        num: item.num,
        cat: item.cat,
        catNombre: item.catNombre,
        label: item.label
      });
    }
  });

  // Reglas de severidad clínica directa (PA >= 140/90 o signos de alarma)
  const pas = parseInt(presion_sistolica, 10) || 0;
  const pad = parseInt(presion_diastolica, 10) || 0;
  const crisisHipertensiva = pas >= 140 || pad >= 90;

  if (crisisHipertensiva && !indicadoresEvaluados['ind_11']) {
    indicadoresEvaluados['ind_11'] = true;
    const ind11Obj = INDICADORES_ARO.find(i => i.id === 'ind_11');
    if (ind11Obj && !indicadoresPositivos.some(p => p.id === 'ind_11')) {
      indicadoresPositivos.push(ind11Obj);
    }
  }

  // Talla baja directa
  if (talla_cm && talla_cm < 145 && !indicadoresEvaluados['ind_19']) {
    indicadoresEvaluados['ind_19'] = true;
    const ind19Obj = INDICADORES_ARO.find(i => i.id === 'ind_19');
    if (ind19Obj && !indicadoresPositivos.some(p => p.id === 'ind_19')) {
      indicadoresPositivos.push(ind19Obj);
    }
  }

  const totalActivos = indicadoresPositivos.length;
  // Regla ARO: Si la suma de indicadores positivos es >= 1 o hay criterio de severidad clínica
  const es_aro = totalActivos >= 1 || crisisHipertensiva;

  // Clasificación y nivel de severidad
  let nivel_urgencia = 'REGULAR';
  if (es_aro) {
    if (crisisHipertensiva || indicadoresEvaluados['ind_13'] || indicadoresEvaluados['ind_16']) {
      nivel_urgencia = 'EMERGENCIA_ROJA';
    } else if (totalActivos >= 3) {
      nivel_urgencia = 'ALTO_RIESGO_SEVERO';
    } else {
      nivel_urgencia = 'ALTO_RIESGO_MODERADO';
    }
  }

  return {
    es_aro,
    total_indicadores_activos: totalActivos,
    indicadores_positivos: indicadoresPositivos,
    indicadores_evaluados: indicadoresEvaluados,
    imc,
    estado_nutricional,
    nivel_urgencia,
    clasificacion: es_aro ? 'ALTO RIESGO OBSTÉTRICO (ARO)' : 'BAJO RIESGO OBSTÉTRICO',
    requiere_referencia: es_aro
  };
}
