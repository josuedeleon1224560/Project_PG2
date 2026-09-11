import { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Search, UserPlus, CheckCircle, HeartPulse,
  Activity, Save, FileText, UserCheck, ShieldAlert,
  Send, Printer, RefreshCw, X, Info, Stethoscope, Building2, Mail,
  QrCode, Smartphone, Copy, Check, ExternalLink, Globe
} from 'lucide-react';
import {
  buscarPacientePorCUI as apiBuscarCUI,
  crearPaciente as apiCrearPaciente,
  actualizarPaciente as apiActualizarPaciente,
  evaluarFichaARO as apiEvaluarARO,
  despacharAlertaWhatsApp as apiDespacharWhatsApp,
  despacharAlertaEmail as apiDespacharEmail,
  guardarBorradorMovil as apiGuardarBorradorMovil,
  obtenerBorradorMovil as apiObtenerBorradorMovil,
  API_BASE_URL
} from '../services/api.js';

const CATEGORIAS = [
  { id: 'TODOS', nombre: 'Todos los Indicadores', count: 25 },
  { id: 'I', nombre: 'Cat I: Antecedentes Gineco-Obstétricos', count: 8 },
  { id: 'II', nombre: 'Cat II: Patologías y Complicaciones Actuales', count: 10 },
  { id: 'III', nombre: 'Cat III: Estado Nutricional y Biopsicosocial', count: 7 }
];

const LISTA_INDICADORES = [
  // Categoría I: Antecedentes Gineco-Obstétricos
  { id: 'ind_01', num: 1, cat: 'I', label: 'Ind 01: Edad menor de 20 años (< 20)', detalle: 'Adolescencia temprana o tardía con riesgo de desproporción cefalopélvica.' },
  { id: 'ind_02', num: 2, cat: 'I', label: 'Ind 02: Edad mayor o igual a 35 años (≥ 35)', detalle: 'Mayor incidencia de anomalías cromosómicas y patologías crónicas.' },
  { id: 'ind_03', num: 3, cat: 'I', label: 'Ind 03: Antecedente de ≥3 abortos espontáneos', detalle: 'Sospecha de incompetencia cervical, síndrome antifosfolípido o endocrinopatía.' },
  { id: 'ind_04', num: 4, cat: 'I', label: 'Ind 04: Muerte fetal o neonatal previa', detalle: 'Antecedente obstétrico de pérdida perinatal inexplicable.' },
  { id: 'ind_05', num: 5, cat: 'I', label: 'Ind 05: Parto prematuro previo (<37 sem) o bajo peso (<2500g)', detalle: 'Riesgo elevado de recurrencia de prematuridad.' },
  { id: 'ind_06', num: 6, cat: 'I', label: 'Ind 06: Cesárea previa o cirugía uterina previa', detalle: 'Riesgo de acretismo placentario o rotura uterina durante el trabajo de parto.' },
  { id: 'ind_07', num: 7, cat: 'I', label: 'Ind 07: Periodo intergenésico corto (< 2 años)', detalle: 'Menor recuperación de reservas nutricionales maternas.' },
  { id: 'ind_08', num: 8, cat: 'I', label: 'Ind 08: Gran multípara (≥4 partos previos)', detalle: 'Mayor riesgo de atonía uterina, hemorragia posparto y malposiciones fetales.' },

  // Categoría II: Patologías y Complicaciones Actuales
  { id: 'ind_09', num: 9, cat: 'II', label: 'Ind 09: Hipertensión arterial crónica diagnosticada', detalle: 'Presión alta preexistente al embarazo.' },
  { id: 'ind_10', num: 10, cat: 'II', label: 'Ind 10: Diabetes pregestacional / gestacional', detalle: 'Trastorno metabólico con riesgo de macrosomía y preeclampsia.' },
  { id: 'ind_11', num: 11, cat: 'II', label: 'Ind 11: Presión arterial actual ≥ 140/90 mmHg', detalle: 'Criterio mayor de preeclampsia / síndrome hipertensivo gestacional.' },
  { id: 'ind_12', num: 12, cat: 'II', label: 'Ind 12: Hemorragia transvaginal en 1er trimestre', detalle: 'Amenaza de aborto o sospecha de embarazo ectópico/molar.' },
  { id: 'ind_13', num: 13, cat: 'II', label: 'Ind 13: Hemorragia transvaginal en 2do o 3er trimestre', detalle: 'Sospecha de placenta previa o desprendimiento prematuro de placenta.' },
  { id: 'ind_14', num: 14, cat: 'II', label: 'Ind 14: Embarazo múltiple confirmado', detalle: 'Sobredistensión uterina, riesgo de parto pretérmino y preeclampsia.' },
  { id: 'ind_15', num: 15, cat: 'II', label: 'Ind 15: Presentación no cefálica (>36 semanas)', detalle: 'Situación transversa o podálica en término de gestación.' },
  { id: 'ind_16', num: 16, cat: 'II', label: 'Ind 16: Ruptura prematura de membranas (RPM)', detalle: 'Riesgo inminente de corioamnionitis e infección neonatal.' },
  { id: 'ind_17', num: 17, cat: 'II', label: 'Ind 17: Infección de vías urinarias (ITU) recurrente', detalle: 'Desencadenante frecuente de amenaza de parto prematuro.' },
  { id: 'ind_18', num: 18, cat: 'II', label: 'Ind 18: Infección de transmisión sexual activa / VIH', detalle: 'Riesgo de transmisión vertical materno-infantil.' },

  // Categoría III: Estado Nutricional y Biopsicosocial
  { id: 'ind_19', num: 19, cat: 'III', label: 'Ind 19: Talla baja materna (< 145 cm)', detalle: 'Estrechez pélvica materna y distocia del trabajo de parto.' },
  { id: 'ind_20', num: 20, cat: 'III', label: 'Ind 20: Desnutrición materna (IMC < 18.5)', detalle: 'Déficit calórico-proteico y restricción del crecimiento intrauterino (RCIU).' },
  { id: 'ind_21', num: 21, cat: 'III', label: 'Ind 21: Obesidad materna (IMC ≥ 30.0)', detalle: 'Riesgo cardiovascular, diabetes gestacional y macrosomía.' },
  { id: 'ind_22', num: 22, cat: 'III', label: 'Ind 22: Anemia clínica / laboratorio (Hb < 11 g/dL)', detalle: 'Compromiso de oxigenación tisular materno-fetal.' },
  { id: 'ind_23', num: 23, cat: 'III', label: 'Ind 23: Cardiopatía, nefropatía u otra patología crónica', detalle: 'Enfermedades de base de alta morbimortalidad materna.' },
  { id: 'ind_24', num: 24, cat: 'III', label: 'Ind 24: Sin control prenatal en 1er o 2do trimestre', detalle: 'Captación tardía con ausencia de tamizaje básico preventivo.' },
  { id: 'ind_25', num: 25, cat: 'III', label: 'Ind 25: Vulnerabilidad extrema / Violencia intrafamiliar', detalle: 'Factores psicosociales que impiden el acceso oportuno a los servicios de salud.' },
];

export default function CapturaEpidemiologica({
  pacientePreseleccionado = null,
  borradorQRInicial = null,
  onIrABoletas = null
}) {
  const [paciente, setPaciente] = useState(pacientePreseleccionado);
  const [cuiBusqueda, setCuiBusqueda] = useState(
    pacientePreseleccionado ? (pacientePreseleccionado.cui_dpi || '') : ''
  );
  const [prevIdPreseleccionado, setPrevIdPreseleccionado] = useState(
    pacientePreseleccionado?.id_paciente
  );

  // Sincronización declarativa de props a estado durante render (sin useEffect)
  if (pacientePreseleccionado?.id_paciente !== prevIdPreseleccionado) {
    setPrevIdPreseleccionado(pacientePreseleccionado?.id_paciente);
    setPaciente(pacientePreseleccionado);
    setCuiBusqueda(pacientePreseleccionado?.cui_dpi || '');
  }

  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('TODOS');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [resultadoARO, setResultadoARO] = useState(null);

  // Estados para Transferencia y Continuidad Móvil por Código QR
  const [mostrarModalQR, setMostrarModalQR] = useState(false);
  const [cargandoQR, setCargandoQR] = useState(false);
  const [borradorToken, setBorradorToken] = useState(null);
  const [urlQR, setUrlQR] = useState('');
  const [copiado, setCopiado] = useState(false);
  const [ipLocal, setIpLocal] = useState(() => {
    return window.location.hostname || 'localhost';
  });
  const [sesionMovilActiva, setSesionMovilActiva] = useState(Boolean(borradorQRInicial));
  const [transferidoAMovil, setTransferidoAMovil] = useState(false);

  // Bloqueo de edición en PC si la evaluación fue transferida al teléfono
  const bloqueadoPorMovil = !sesionMovilActiva && transferidoAMovil;

  // Formulario Editar Paciente / Antecedentes
  const [editarForm, setEditarForm] = useState({
    telefono: '',
    direccion: '',
    municipio: '',
    comunidad: '',
    gestas_previas: 0,
    partos_previos: 0,
    cesareas_previas: 0,
    abortos_previos: 0
  });

  // Formulario Nueva Paciente
  const [nuevoForm, setNuevoForm] = useState({
    cui_dpi: '',
    nombres: '',
    apellidos: '',
    fecha_nacimiento: '',
    telefono: '',
    direccion: '',
    municipio: '',
    comunidad: '',
    gestas_previas: 0,
    partos_previos: 0,
    cesareas_previas: 0,
    abortos_previos: 0
  });

  // Evaluación Clínica y Biometría
  const [clinica, setClinica] = useState({
    semanas_gestacion: '',
    peso_kg: '',
    talla_cm: '',
    presion_sistolica: '',
    presion_diastolica: '',
    frecuencia_cardiaca_fetal: '',
    observaciones: ''
  });

  // Estado de Indicadores manuales
  const [indicadoresManuales, setIndicadoresManuales] = useState({});

  // Cálculo de IMC en tiempo real
  const imcInfo = useMemo(() => {
    const peso = parseFloat(clinica.peso_kg);
    const talla = parseFloat(clinica.talla_cm);
    if (!peso || !talla || talla <= 0) {
      return { valor: null, estado: 'Pendiente', color: 'text-slate-400 bg-slate-100' };
    }
    const tallaM = talla / 100;
    const valor = parseFloat((peso / (tallaM * tallaM)).toFixed(2));

    if (valor < 18.5) {
      return { valor, estado: 'Desnutrición (Bajo Peso)', color: 'text-amber-800 bg-amber-100 border-amber-300' };
    } else if (valor >= 18.5 && valor <= 24.9) {
      return { valor, estado: 'Peso Normal / Saludable', color: 'text-emerald-800 bg-emerald-100 border-emerald-300' };
    } else if (valor >= 25.0 && valor <= 29.9) {
      return { valor, estado: 'Sobrepeso', color: 'text-yellow-800 bg-yellow-100 border-yellow-300' };
    } else {
      return { valor, estado: 'Obesidad', color: 'text-red-800 bg-red-100 border-red-300' };
    }
  }, [clinica.peso_kg, clinica.talla_cm]);

  // Indicadores automáticos calculados a partir de biometría y antecedentes
  const indicadoresCalculados = useMemo(() => {
    const auto = {};
    if (clinica.talla_cm && parseFloat(clinica.talla_cm) < 145) {
      auto['ind_19'] = true;
    }
    if (imcInfo.valor && imcInfo.valor < 18.5) {
      auto['ind_20'] = true;
    }
    if (imcInfo.valor && imcInfo.valor >= 30.0) {
      auto['ind_21'] = true;
    }
    const pas = parseInt(clinica.presion_sistolica, 10);
    const pad = parseInt(clinica.presion_diastolica, 10);
    if ((pas && pas >= 140) || (pad && pad >= 90)) {
      auto['ind_11'] = true;
    }
    if (paciente) {
      if (paciente.fecha_nacimiento) {
        const anioNac = new Date(paciente.fecha_nacimiento).getFullYear();
        const anioAct = new Date().getFullYear();
        const edad = anioAct - anioNac;
        if (edad < 20) auto['ind_01'] = true;
        if (edad >= 35) auto['ind_02'] = true;
      }
      if (parseInt(paciente.abortos_previos, 10) >= 3) auto['ind_03'] = true;
      if (parseInt(paciente.cesareas_previas, 10) >= 1) auto['ind_06'] = true;
      if (parseInt(paciente.partos_previos, 10) >= 4) auto['ind_08'] = true;
    }
    return auto;
  }, [clinica.talla_cm, clinica.presion_sistolica, clinica.presion_diastolica, imcInfo.valor, paciente]);

  // Mapa combinado de indicadores activos
  const indicadores = useMemo(() => {
    return { ...indicadoresCalculados, ...indicadoresManuales };
  }, [indicadoresCalculados, indicadoresManuales]);

  const totalActivos = useMemo(() => {
    return Object.values(indicadores).filter(Boolean).length;
  }, [indicadores]);

  const esARO = useMemo(() => {
    const pas = parseInt(clinica.presion_sistolica, 10) || 0;
    const pad = parseInt(clinica.presion_diastolica, 10) || 0;
    return totalActivos > 0 || pas >= 140 || pad >= 90;
  }, [totalActivos, clinica.presion_sistolica, clinica.presion_diastolica]);

  const contarPorCat = (catId) => {
    if (catId === 'TODOS') return totalActivos;
    const items = LISTA_INDICADORES.filter(i => i.cat === catId);
    return items.filter(i => !!indicadores[i.id]).length;
  };

  const handleBuscarCUI = async (e) => {
    if (e) e.preventDefault();
    if (!cuiBusqueda || cuiBusqueda.trim().length !== 13) {
      alert('El CUI debe contener exactamente 13 dígitos numéricos.');
      return;
    }

    setBuscando(true);
    try {
      const data = await apiBuscarCUI(cuiBusqueda.trim());
      if (data && data.existe && data.paciente) {
        setPaciente({
          ...data.paciente,
          total_evaluaciones_previas: data.total_evaluaciones_previas || 0,
          evaluaciones_previas: data.evaluaciones_previas || []
        });
        setMostrarModalNuevo(false);
      } else {
        setPaciente(null);
        setNuevoForm(prev => ({ ...prev, cui_dpi: cuiBusqueda.trim() }));
        setMostrarModalNuevo(true);
      }
    } catch (err) {
      console.error('Error al consultar paciente:', err);
      setPaciente(null);
      setNuevoForm(prev => ({ ...prev, cui_dpi: cuiBusqueda.trim() }));
      setMostrarModalNuevo(true);
    } finally {
      setBuscando(false);
    }
  };

  const handleCrearPaciente = async (e) => {
    e.preventDefault();
    try {
      const data = await apiCrearPaciente(nuevoForm);
      if (data && data.paciente) {
        const pacGuardada = data.paciente;
        setPaciente(pacGuardada);
        setCuiBusqueda(pacGuardada.cui_dpi || pacGuardada.dpi_cui || nuevoForm.cui_dpi);
        setMostrarModalNuevo(false);
        alert('Expediente de gestante registrado con éxito en la base de datos.');
      } else {
        alert(data.message || 'Error al registrar paciente.');
      }
    } catch (err) {
      console.error('Error al crear paciente:', err);
      alert(err.message || 'Error de conexión con el servidor.');
    }
  };

  const handleActualizarPaciente = async (e) => {
    e.preventDefault();
    if (!paciente?.id_paciente) return;
    try {
      const data = await apiActualizarPaciente(paciente.id_paciente, editarForm);
      if (data && data.paciente) {
        setPaciente(prev => ({
          ...prev,
          ...data.paciente
        }));
        setMostrarModalEditar(false);
        alert('Expediente y antecedentes obstétricos actualizados con éxito.');
      } else {
        alert(data.message || 'Error al actualizar expediente.');
      }
    } catch (err) {
      console.error('Error al actualizar paciente:', err);
      alert(err.message || 'Error de conexión con el servidor.');
    }
  };

  // Carga automática si el componente se abrió mediante escaneo de Código QR
  useEffect(() => {
    let cancelado = false;

    if (borradorQRInicial) {
      apiObtenerBorradorMovil(borradorQRInicial)
        .then((data) => {
          if (!cancelado && data && data.success && data.paciente) {
            setPaciente(data.paciente);
            setCuiBusqueda(data.paciente.cui_dpi || data.paciente.dpi_cui || '');
            if (data.evaluacion?.clinica) {
              setClinica(prev => ({ ...prev, ...data.evaluacion.clinica }));
            }
            if (data.evaluacion?.indicadoresManuales) {
              setIndicadoresManuales(data.evaluacion.indicadoresManuales);
            }
            setSesionMovilActiva(true);
          }
        })
        .catch((err) => {
          if (!cancelado) {
            console.error('Error al cargar borrador QR móvil:', err);
          }
        })
        .finally(() => {
          if (!cancelado) {
            setCargandoQR(false);
          }
        });
    }

    return () => {
      cancelado = true;
    };
  }, [borradorQRInicial]);

  // Generación de Sesión y Código QR Móvil
  const handleGenerarQR = async () => {
    if (!paciente) {
      alert('Debe consultar o registrar una paciente antes de generar el código QR móvil.');
      return;
    }

    setCargandoQR(true);
    setMostrarModalQR(true);

    try {
      const res = await apiGuardarBorradorMovil({
        paciente,
        evaluacion: {
          clinica,
          indicadoresManuales
        }
      });

      if (res && res.success && res.token) {
        setBorradorToken(res.token);
        setTransferidoAMovil(true);
        
        let host = ipLocal;
        if ((!host || host === 'localhost' || host === '127.0.0.1') && res.ipSugerida && res.ipSugerida !== 'localhost') {
          host = res.ipSugerida;
          setIpLocal(res.ipSugerida);
        } else if (!host) {
          host = window.location.hostname || 'localhost';
        }

        const port = window.location.port ? `:${window.location.port}` : '';
        const url = `${window.location.protocol}//${host}${port}/?borrador=${res.token}&modo=movil`;
        setUrlQR(url);
      } else {
        alert(res.message || 'Error al generar la sesión móvil.');
      }
    } catch (err) {
      console.error('Error al generar QR móvil:', err);
      alert(err.message || 'Error al conectar con el servidor para generar el código QR.');
    } finally {
      setCargandoQR(false);
    }
  };

  const actualizarUrlConIP = (nuevaIP) => {
    setIpLocal(nuevaIP);
    if (borradorToken) {
      const host = nuevaIP || window.location.hostname || 'localhost';
      const port = window.location.port ? `:${window.location.port}` : '';
      const url = `${window.location.protocol}//${host}${port}/?borrador=${borradorToken}&modo=movil`;
      setUrlQR(url);
    }
  };

  const handleCopiarEnlace = async () => {
    if (!urlQR) return;
    try {
      await navigator.clipboard.writeText(urlQR);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      alert(`Enlace móvil: ${urlQR}`);
    }
  };

  const toggleIndicador = (id) => {
    setIndicadoresManuales(prev => ({
      ...prev,
      [id]: !indicadores[id]
    }));
  };

  const handleGuardarYEvaluar = async () => {
    if (!paciente) {
      alert('Debe consultar o registrar una paciente antes de guardar la evaluación.');
      return;
    }
    if (!clinica.semanas_gestacion || !clinica.presion_sistolica || !clinica.presion_diastolica) {
      alert('Complete los campos obligatorios: Semanas de gestación y Presión arterial sistólica/diastólica.');
      return;
    }

    setGuardando(true);
    try {
      const payload = {
        id_paciente: paciente.id_paciente,
        semanas_gestacion: parseInt(clinica.semanas_gestacion, 10),
        peso_kg: parseFloat(clinica.peso_kg) || null,
        talla_cm: parseFloat(clinica.talla_cm) || null,
        presion_sistolica: parseInt(clinica.presion_sistolica, 10),
        presion_diastolica: parseInt(clinica.presion_diastolica, 10),
        frecuencia_cardiaca_fetal: parseInt(clinica.frecuencia_cardiaca_fetal, 10) || null,
        indicadores,
        observaciones_clinicas: clinica.observaciones,
        via_captura: sesionMovilActiva ? 'MÓVIL' : 'WEB'
      };

      const data = await apiEvaluarARO(payload);
      if (data && data.success) {
        setResultadoARO(data);
      } else {
        alert(data.message || 'Error al procesar la evaluación epidemiológica.');
      }
    } catch (err) {
      console.error('Error al evaluar ficha:', err);
      alert(err.message || 'Error de conexión al enviar la evaluación.');
    } finally {
      setGuardando(false);
    }
  };

  const indicadoresFiltrados = useMemo(() => {
    if (categoriaFiltro === 'TODOS') return LISTA_INDICADORES;
    return LISTA_INDICADORES.filter(i => i.cat === categoriaFiltro);
  }, [categoriaFiltro]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* BANNER INFORMATIVO: SESIÓN MÓVIL POR CÓDIGO QR */}
      {sesionMovilActiva && (
        <div className="bg-emerald-600 text-white px-5 py-3 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-bold shadow-md animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 animate-pulse text-emerald-200 flex-shrink-0" />
            <span>Modo de Captura Móvil Activo: Formulario sincronizado desde Código QR</span>
          </div>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide">
            Vía de Registro: MÓVIL
          </span>
        </div>
      )}

      {/* 1. BARRA SUPERIOR DE BÚSQUEDA Y VALIDACIÓN */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="text-sky-600 w-5 h-5" /> Búsqueda y Validación de Gestante por CUI / DPI
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consulte el Registro Único de Gestantes en la base de datos institucional
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200 rounded-full flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> DDRISS Suchitepéquez
          </span>
        </div>

        <form onSubmit={handleBuscarCUI} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <input
              type="text"
              maxLength={13}
              value={cuiBusqueda}
              onChange={(e) => setCuiBusqueda(e.target.value.replace(/\D/g, ''))}
              placeholder="Ingrese los 13 dígitos del DPI (Ej: 2345678901001)"
              className="w-full pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none text-slate-800 text-sm font-medium tracking-wide placeholder:font-normal"
            />
            {cuiBusqueda && (
              <button
                type="button"
                onClick={() => setCuiBusqueda('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={buscando}
            className="bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-semibold px-6 py-2.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 text-sm shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4" /> {buscando ? 'Buscando...' : 'Consultar CUI'}
          </button>
          <button
            type="button"
            onClick={() => {
              setNuevoForm(prev => ({ ...prev, cui_dpi: cuiBusqueda }));
              setMostrarModalNuevo(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition text-sm shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Nueva Gestante
          </button>
        </form>

        {/* FICHA RESUMEN PACIENTE SELECCIONADA */}
        {paciente && (
          <div className="mt-4 bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sky-950 font-bold text-base flex-wrap">
                <UserCheck className="text-sky-600 w-5 h-5" />
                <span>{paciente.nombres} {paciente.apellidos}</span>
                <span className="bg-sky-200/80 text-sky-900 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  CUI: {paciente.cui_dpi || paciente.dpi_cui}
                </span>
                {paciente.total_evaluaciones_previas > 0 && (
                  <span className="bg-purple-100 text-purple-900 border border-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    {paciente.total_evaluaciones_previas} control(es) previo(s) registrado(s)
                  </span>
                )}
              </div>
              <div className="text-xs text-sky-800 flex flex-wrap gap-x-4 gap-y-1">
                <span><strong>Municipio:</strong> {paciente.municipio || 'No especificado'} {paciente.comunidad ? `(${paciente.comunidad})` : ''}</span>
                <span><strong>F. Nacimiento:</strong> {paciente.fecha_nacimiento ? String(paciente.fecha_nacimiento).substring(0, 10) : 'No registrada'}</span>
                <span><strong>Historial Obstétrico:</strong> G:{paciente.gestas_previas || 0} | P:{paciente.partos_previos || 0} | C:{paciente.cesareas_previas || 0} | A:{paciente.abortos_previos || 0}</span>
                {paciente.telefono && <span><strong>Tel:</strong> {paciente.telefono}</span>}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
              {!sesionMovilActiva && (
                <button
                  type="button"
                  onClick={handleGenerarQR}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
                >
                  <QrCode className="w-4 h-4" />
                  <span>{transferidoAMovil ? 'Ver Código QR' : 'Continuar en Móvil (QR)'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setEditarForm({
                    telefono: paciente.telefono || '',
                    direccion: paciente.direccion || '',
                    municipio: paciente.municipio || '',
                    comunidad: paciente.comunidad || '',
                    gestas_previas: paciente.gestas_previas || 0,
                    partos_previos: paciente.partos_previos || 0,
                    cesareas_previas: paciente.cesareas_previas || 0,
                    abortos_previos: paciente.abortos_previos || 0
                  });
                  setMostrarModalEditar(true);
                }}
                className="text-xs font-bold text-sky-700 hover:text-sky-900 underline cursor-pointer"
              >
                Actualizar Antecedentes
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => {
                  setPaciente(null);
                  setTransferidoAMovil(false);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Cambiar Paciente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AVISO DE TRANSFERENCIA Y BLOQUEO EN COMPUTADORA */}
      {bloqueadoPorMovil && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-200 text-amber-950 rounded-xl flex-shrink-0">
                <Smartphone className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-black text-amber-950">
                  Evaluación Prenatal Transferida al Dispositivo Móvil
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 font-medium">
                  La captura de los 25 factores de riesgo y signos vitales se encuentra activa en el teléfono del personal de salud.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => setMostrarModalQR(true)}
                className="px-3.5 py-2 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                <span>Ver Código QR</span>
              </button>
              <button
                type="button"
                onClick={() => setTransferidoAMovil(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm active:scale-95"
              >
                Reanudar en PC
              </button>
            </div>
          </div>
          <p className="text-[11px] text-amber-800 bg-amber-100/80 p-2.5 rounded-xl border border-amber-200">
            Para garantizar la consistencia clínica, la edición directa en la computadora queda suspendida mientras se completa la evaluación en el teléfono móvil.
          </p>
        </div>
      )}

      {/* CONTENEDOR DE EVALUACIÓN (BLOQUEADO SI ESTÁ EN MÓVIL) */}
      <div className={`space-y-6 transition-opacity duration-200 ${bloqueadoPorMovil ? 'opacity-40 pointer-events-none select-none' : ''}`}>

      {/* 2. SEMÁFORO VISUAL Y ALERTA EPIDEMIOLÓGICA EN VIVO */}
      <div className={`p-5 rounded-2xl border transition-all shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${esARO
        ? 'bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/5 border-red-300 text-red-900'
        : 'bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border-emerald-300 text-emerald-900'
        }`}>
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-xl ${esARO ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
            {esARO ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${esARO ? 'bg-red-200 text-red-950' : 'bg-emerald-200 text-emerald-950'
                }`}>
                {esARO ? 'DICTAMEN: ALTO RIESGO OBSTÉTRICO (ARO)' : 'DICTAMEN: BAJO RIESGO OBSTÉTRICO'}
              </span>
              {esARO && (
                <span className="text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                  Boleta Oficial Requerida
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 mt-1 font-medium">
              {esARO
                ? `Se han detectado ${totalActivos} criterio(s) normado(s) de riesgo. Requiere emisión de boleta y referencia inmediata.`
                : 'Parámetros biométricos y antecedentes dentro de los límites regulares de atención prenatal.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="text-right">
            <span className="text-[11px] block text-slate-500 font-semibold">Criterios Activos</span>
            <span className={`text-xl font-black ${esARO ? 'text-red-700' : 'text-emerald-700'}`}>
              {totalActivos} / 25
            </span>
          </div>
        </div>
      </div>

      {/* 3. EVALUACIÓN DE SIGNOS VITALES Y BIOMETRÍA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-sky-600" /> Signos Vitales y Biometría Materno-Fetal
          </h3>
          <span className="text-xs text-slate-500 italic">* Campos requeridos</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Sem. Gestación *</label>
            <input
              type="number"
              min={1}
              max={44}
              value={clinica.semanas_gestacion}
              onChange={(e) => setClinica({ ...clinica, semanas_gestacion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-semibold text-slate-800"
              placeholder="Ej. 32"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">P. Sistólica (mmHg) *</label>
            <input
              type="number"
              value={clinica.presion_sistolica}
              onChange={(e) => setClinica({ ...clinica, presion_sistolica: e.target.value })}
              className={`w-full px-3 py-2 border rounded-xl text-sm outline-none font-semibold ${parseInt(clinica.presion_sistolica, 10) >= 140
                ? 'border-red-400 bg-red-50 text-red-900 ring-2 ring-red-300'
                : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500'
                }`}
              placeholder="Ej. 120"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">P. Diastólica (mmHg) *</label>
            <input
              type="number"
              value={clinica.presion_diastolica}
              onChange={(e) => setClinica({ ...clinica, presion_diastolica: e.target.value })}
              className={`w-full px-3 py-2 border rounded-xl text-sm outline-none font-semibold ${parseInt(clinica.presion_diastolica, 10) >= 90
                ? 'border-red-400 bg-red-50 text-red-900 ring-2 ring-red-300'
                : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500'
                }`}
              placeholder="Ej. 80"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              value={clinica.peso_kg}
              onChange={(e) => setClinica({ ...clinica, peso_kg: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800"
              placeholder="Ej. 62.5"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Talla (cm)</label>
            <input
              type="number"
              value={clinica.talla_cm}
              onChange={(e) => setClinica({ ...clinica, talla_cm: e.target.value })}
              className={`w-full px-3 py-2 border rounded-xl text-sm outline-none font-semibold ${clinica.talla_cm && parseFloat(clinica.talla_cm) < 145
                ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-300'
                : 'border-slate-300 text-slate-800 focus:ring-2 focus:ring-sky-500'
                }`}
              placeholder="Ej. 150"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">FC Fetal (lpm)</label>
            <input
              type="number"
              value={clinica.frecuencia_cardiaca_fetal}
              onChange={(e) => setClinica({ ...clinica, frecuencia_cardiaca_fetal: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800"
              placeholder="Ej. 142"
            />
          </div>
        </div>

        {/* CÁLCULO DE IMC EN VIVO */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700">
            <Activity className="w-4 h-4 text-sky-600" /> Cálculo Automático de IMC:
          </div>
          {imcInfo.valor ? (
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 bg-white border border-slate-300 px-2.5 py-1 rounded-lg">
                {imcInfo.valor} kg/m²
              </span>
              <span className={`px-2.5 py-1 rounded-lg font-bold border ${imcInfo.color}`}>
                {imcInfo.estado}
              </span>
            </div>
          ) : (
            <span className="text-slate-400 italic">Ingrese peso y talla para cálculo automático.</span>
          )}
        </div>
      </div>

      {/* 4. SECCIÓN DE EVALUACIÓN DE LOS 25 INDICADORES NORMATIVOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-sky-600" /> Evaluación de los 25 Factores de Riesgo Normados (MSPAS)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Haga clic sobre cualquier indicador presente en la evaluación prenatal
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIndicadoresManuales({})}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            >
              Limpiar Selección
            </button>
          </div>
        </div>

        {/* PESTAÑAS DE CATEGORÍAS */}
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORIAS.map((cat) => {
            const activos = contarPorCat(cat.id);
            const esActiva = categoriaFiltro === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoriaFiltro(cat.id)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center gap-2 cursor-pointer ${esActiva
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
              >
                <span>{cat.nombre}</span>
                {activos > 0 && (
                  <span className={`text-[10px] px-2 py-0.2 rounded-full font-black ${esActiva ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                    }`}>
                    {activos}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* GRILLA DE LOS 25 INDICADORES */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {indicadoresFiltrados.map((ind) => {
            const activo = Boolean(indicadores[ind.id]);
            return (
              <div
                key={ind.id}
                onClick={() => toggleIndicador(ind.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-3 ${activo
                  ? 'bg-red-50/90 border-red-300 text-red-950 shadow-sm ring-1 ring-red-300'
                  : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={() => { }}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-0 cursor-pointer"
                />
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">{ind.label}</span>
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded ${activo ? 'bg-red-200 text-red-900' : 'bg-slate-200 text-slate-600'
                      }`}>
                      Cat {ind.cat}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {ind.detalle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* OBSERVACIONES CLÍNICAS */}
        <div className="pt-3">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Observaciones Clínicas y Hallazgos Relevantes
          </label>
          <textarea
            rows={2}
            value={clinica.observaciones}
            onChange={(e) => setClinica({ ...clinica, observaciones: e.target.value })}
            placeholder="Ingrese notas médicas adicionales, plan de manejo o antecedentes específicos..."
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* BOTÓN DE ACCIÓN: GUARDAR FICHA Y EVALUAR ARO */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>Al guardar, el sistema evaluará los 25 indicadores y generará la referencia oficial si clasifica ARO.</span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {!sesionMovilActiva && (
              <button
                type="button"
                onClick={handleGenerarQR}
                disabled={!paciente}
                className="px-5 py-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-40 active:scale-95"
              >
                <QrCode className="w-4 h-4 text-emerald-600" />
                <span>{transferidoAMovil ? 'Ver Código QR' : 'Continuar en Móvil (QR)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGuardarYEvaluar}
              disabled={guardando || bloqueadoPorMovil}
              className={`px-8 py-3 rounded-xl text-white font-extrabold text-sm flex items-center justify-center gap-2.5 transition shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer ${esARO
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-500/20'
                }`}
            >
              {guardando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Procesando Evaluación...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {esARO ? 'Guardar Ficha y Evaluar ARO (Emitir Boleta)' : 'Guardar Control Prenatal'}
                </>
              )}
            </button>
          </div>
        </div>

      </div>
      </div>

      {/* 5. MODAL DE RESULTADO / BOLETA DE REFERENCIA GENERADA */}
      {resultadoARO && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto space-y-6">

            {/* ENCABEZADO DEL MODAL */}
            <div className="flex justify-between items-start border-b pb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${resultadoARO.es_aro ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                  {resultadoARO.es_aro ? <ShieldAlert className="w-7 h-7" /> : <CheckCircle className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {resultadoARO.clasificacion || (resultadoARO.es_aro ? 'ALTO RIESGO OBSTÉTRICO (ARO)' : 'BAJO RIESGO OBSTÉTRICO')}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dictamen emitido por el Sistema de Vigilancia Epidemiológica DDRISS Suchitepéquez
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResultadoARO(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CONTENIDO DEL DICTAMEN */}
            <div className="space-y-4 text-xs">

              {/* CONFIRMACIÓN DE GUARDADO */}
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-950 font-bold">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ficha Epidemiológica #{resultadoARO.id_ficha || resultadoARO.ficha?.id_ficha} registrada con éxito en el sistema.</span>
                </span>
                {onIrABoletas && (
                  <button
                    type="button"
                    onClick={() => {
                      setResultadoARO(null);
                      setPaciente(null);
                      setCuiBusqueda('');
                      setIndicadoresManuales({});
                      onIrABoletas();
                    }}
                    className="text-[11px] underline text-sky-800 hover:text-sky-950 font-black cursor-pointer"
                  >
                    Ver en Boletas ARO &rarr;
                  </button>
                )}
              </div>

              {/* DATOS CLAVE */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Paciente</span>
                  <span className="font-bold text-slate-800">{paciente?.nombres} {paciente?.apellidos}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">CUI / DPI</span>
                  <span className="font-bold text-slate-800">{paciente?.cui_dpi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Indicadores Activos</span>
                  <span className={`font-black text-sm ${resultadoARO.es_aro ? 'text-red-700' : 'text-emerald-700'}`}>
                    {resultadoARO.total_indicadores_activos || totalActivos} de 25
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Nivel de Urgencia</span>
                  <span className={`font-extrabold ${resultadoARO.es_aro ? 'text-red-700' : 'text-emerald-700'}`}>
                    {resultadoARO.nivel_urgencia || 'REGULAR'}
                  </span>
                </div>
              </div>

              {/* DETALLE DE BOLETA SI ES ARO */}
              {resultadoARO.es_aro && (
                <div className="bg-red-50/70 border border-red-200 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-red-950 text-sm flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-red-600" /> Boleta Oficial de Referencia MSPAS
                    </span>
                    <span className="font-mono bg-red-200 text-red-900 font-extrabold px-3 py-1 rounded-lg text-xs">
                      {resultadoARO.codigo_correlativo || 'REF-2026-GENERADA'}
                    </span>
                  </div>

                  <p className="text-slate-700">
                    <strong>Destino de Referencia:</strong> {resultadoARO.boleta?.establecimiento_destino || 'Hospital Nacional de Mazatenango'}
                  </p>

                  <div className="space-y-1.5 pt-1">
                    <span className="font-bold text-slate-800 block">Factores ARO Detectados:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {(resultadoARO.indicadores_positivos || LISTA_INDICADORES.filter(i => !!indicadores[i.id])).map((ind, idx) => (
                        <span key={idx} className="bg-white border border-red-200 text-red-900 px-2.5 py-1 rounded-lg font-medium">
                          {ind.label || ind.id}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-red-200/60">
                    <span><strong>Cola de Alerta:</strong> WhatsApp Business MSPAS (Activo)</span>
                    <span><strong>Despacho Email:</strong> Notificación Hospitalaria</span>
                  </div>
                </div>
              )}

              {/* MENSAJE DE ÉXITO O BAJO RIESGO */}
              {!resultadoARO.es_aro && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900">
                  <p className="font-bold">Control Prenatal Registrado sin Criterios de Alto Riesgo.</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    Programe el próximo control según el cronograma regular normado por el MSPAS.
                  </p>
                </div>
              )}

            </div>

            {/* ACCIONES DEL MODAL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-4 border-t">
              {resultadoARO.es_aro && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const id = resultadoARO.id_ficha || resultadoARO.ficha?.id_ficha;
                      if (id) {
                        window.open(`${API_BASE_URL}/fichas/boleta/${id}/pdf`, '_blank');
                      } else {
                        alert('No se encontró el identificador de la ficha para emitir el PDF.');
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer shadow-sm"
                  >
                    <Printer className="w-4 h-4 text-sky-400" /> Descargar PDF
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const id = resultadoARO.id_ficha || resultadoARO.ficha?.id_ficha;
                      if (!id) return;
                      try {
                        const data = await apiDespacharWhatsApp(id);
                        if (data.linkWhatsApp) {
                          window.open(data.linkWhatsApp, '_blank');
                        }
                        alert(data.message || 'Alerta estructurada lista para envío vía WhatsApp.');
                      } catch (e) {
                        console.error(e);
                        alert('Error al procesar alerta de WhatsApp.');
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer shadow-sm"
                  >
                    <Send className="w-4 h-4" /> Alerta WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const id = resultadoARO.id_ficha || resultadoARO.ficha?.id_ficha;
                      if (!id) return;
                      try {
                        const data = await apiDespacharEmail(id);
                        alert(data.message || 'Boleta enviada satisfactoriamente por correo electrónico.');
                      } catch (e) {
                        console.error(e);
                        alert('Error al despachar por correo.');
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer shadow-sm"
                  >
                    <Mail className="w-4 h-4" /> Enviar por Correo
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  setResultadoARO(null);
                  setPaciente(null);
                  setCuiBusqueda('');
                  setIndicadoresManuales({});
                  setClinica({
                    semanas_gestacion: '',
                    peso_kg: '',
                    talla_cm: '',
                    presion_sistolica: '',
                    presion_diastolica: '',
                    frecuencia_cardiaca_fetal: '',
                    observaciones: ''
                  });
                }}
                className={`w-full py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 text-xs transition cursor-pointer ${!resultadoARO.es_aro
                  ? 'col-span-full sm:col-span-2 bg-sky-600 hover:bg-sky-700 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                  }`}
              >
                <RefreshCw className="w-4 h-4" /> Nueva Evaluación
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL: REGISTRAR NUEVA GESTANTE */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-sky-600 w-5 h-5" /> Registro de Nueva Gestante
              </h3>
              <button
                onClick={() => setMostrarModalNuevo(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-5">
              El CUI consultado no posee ficha previa en el sistema. Complete la información base para crear el expediente único.
            </p>

            <form onSubmit={handleCrearPaciente} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CUI / DPI *</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={nuevoForm.cui_dpi}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, cui_dpi: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={nuevoForm.fecha_nacimiento}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, fecha_nacimiento: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.nombres}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, nombres: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. María Elena"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={nuevoForm.apellidos}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, apellidos: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. Gómez López"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Municipio *</label>
                  <select
                    required
                    value={nuevoForm.municipio}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                  >
                    <option value="">Seleccione municipio...</option>
                    <option>Mazatenango</option>
                    <option>San Antonio Suchitepéquez</option>
                    <option>Chicacao</option>
                    <option>Cuyotenango</option>
                    <option>Patulul</option>
                    <option>San Bernardino</option>
                    <option>Samayac</option>
                    <option>Santo Domingo Suchitepéquez</option>
                    <option>San Gabriel</option>
                    <option>San Lorenzo</option>
                    <option>San Miguel Panán</option>
                    <option>San Pablo Jocopilas</option>
                    <option>Santa Bárbara</option>
                    <option>Santo Tomás La Unión</option>
                    <option>Zunilito</option>
                    <option>Pueblo Nuevo</option>
                    <option>Río Bravo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Comunidad / Aldea / Caserío</label>
                  <input
                    type="text"
                    value={nuevoForm.comunidad}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, comunidad: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. Cantón Concepción"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Gestas Previas</label>
                  <input
                    type="number"
                    min={0}
                    value={nuevoForm.gestas_previas}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, gestas_previas: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Partos Previos</label>
                  <input
                    type="number"
                    min={0}
                    value={nuevoForm.partos_previos}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, partos_previos: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cesáreas Previas</label>
                  <input
                    type="number"
                    min={0}
                    value={nuevoForm.cesareas_previas}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, cesareas_previas: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Abortos Previos</label>
                  <input
                    type="number"
                    min={0}
                    value={nuevoForm.abortos_previos}
                    onChange={(e) => setNuevoForm({ ...nuevoForm, abortos_previos: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Crear Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: ACTUALIZAR ANTECEDENTES Y DATOS DE GESTANTE */}
      {mostrarModalEditar && paciente && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="text-sky-600 w-5 h-5" /> Actualizar Datos y Antecedentes Obstétricos
                </h3>
                <p className="text-xs text-slate-500">
                  {paciente.nombres} {paciente.apellidos} — CUI: {paciente.cui_dpi || paciente.dpi_cui}
                </p>
              </div>
              <button
                onClick={() => setMostrarModalEditar(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActualizarPaciente} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={editarForm.telefono}
                    onChange={(e) => setEditarForm({ ...editarForm, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. 55551234"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dirección Domiciliar</label>
                  <input
                    type="text"
                    value={editarForm.direccion}
                    onChange={(e) => setEditarForm({ ...editarForm, direccion: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Zona o sector de residencia"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Municipio</label>
                  <select
                    value={editarForm.municipio}
                    onChange={(e) => setEditarForm({ ...editarForm, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 bg-white"
                  >
                    <option value="">Seleccione Municipio</option>
                    <option>Mazatenango</option>
                    <option>Chicacao</option>
                    <option>Cuyotenango</option>
                    <option>Patulul</option>
                    <option>San Bernardino</option>
                    <option>Samayac</option>
                    <option>Santo Domingo Suchitepéquez</option>
                    <option>San Gabriel</option>
                    <option>San Lorenzo</option>
                    <option>San Miguel Panán</option>
                    <option>San Pablo Jocopilas</option>
                    <option>Santa Bárbara</option>
                    <option>Santo Tomás La Unión</option>
                    <option>Zunilito</option>
                    <option>Pueblo Nuevo</option>
                    <option>Río Bravo</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Comunidad / Aldea</label>
                  <input
                    type="text"
                    value={editarForm.comunidad}
                    onChange={(e) => setEditarForm({ ...editarForm, comunidad: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. Cantón Concepción"
                  />
                </div>
              </div>

              <div className="bg-sky-50/70 p-4 rounded-2xl border border-sky-200 space-y-3">
                <span className="font-bold text-sky-950 block">Historial Obstétrico Acumulado (G - P - C - A)</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Gestas Previas</label>
                    <input
                      type="number"
                      min={0}
                      value={editarForm.gestas_previas}
                      onChange={(e) => setEditarForm({ ...editarForm, gestas_previas: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Partos Previos</label>
                    <input
                      type="number"
                      min={0}
                      value={editarForm.partos_previos}
                      onChange={(e) => setEditarForm({ ...editarForm, partos_previos: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Cesáreas Previas</label>
                    <input
                      type="number"
                      min={0}
                      value={editarForm.cesareas_previas}
                      onChange={(e) => setEditarForm({ ...editarForm, cesareas_previas: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-600 mb-1">Abortos Previos</label>
                    <input
                      type="number"
                      min={0}
                      value={editarForm.abortos_previos}
                      onChange={(e) => setEditarForm({ ...editarForm, abortos_previos: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarModalEditar(false)}
                  className="px-5 py-2.5 border border-slate-300 rounded-xl text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer"
                >
                  Guardar Cambios en Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. MODAL DE CÓDIGO QR PARA CONTINUIDAD EN DISPOSITIVO MÓVIL */}
      {mostrarModalQR && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5">
            {/* Encabezado */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Captura Móvil por Código QR
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Continúe el llenado de la ficha prenatal en su smartphone
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalQR(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenedor del Código QR */}
            <div className="flex flex-col items-center justify-center p-5 bg-slate-50 rounded-2xl border border-slate-200">
              {cargandoQR ? (
                <div className="py-12 flex flex-col items-center gap-2 text-slate-500">
                  <RefreshCw className="w-7 h-7 animate-spin text-emerald-600" />
                  <span className="text-xs font-semibold">Generando sesión móvil...</span>
                </div>
              ) : urlQR ? (
                <div className="space-y-3 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-200">
                    <QRCodeSVG
                      value={urlQR}
                      size={210}
                      level="H"
                      marginSize={2}
                    />
                  </div>
                  <span className="text-[11px] font-bold text-slate-700 text-center">
                    Paciente: {paciente?.nombres} {paciente?.apellidos}
                  </span>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-red-600">
                  No fue posible generar el código QR. Intente de nuevo.
                </div>
              )}
            </div>

            {/* Instrucciones de Escaneo */}
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 text-[11px] text-emerald-950 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                <Info className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                Instrucciones para el personal de salud:
              </p>
              <p className="text-emerald-800 leading-snug">
                1. Abra la cámara de su teléfono móvil o aplicación de escaneo QR.
                <br />
                2. Apunte al código para abrir el formulario en su navegador móvil.
                <br />
                3. Complete los 25 indicadores clínicos junto a la gestante y guarde la evaluación.
              </p>
            </div>

            {/* Configuración de IP / Red Local y Copiar Enlace */}
            <div className="space-y-2">
              <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Dirección IP / Host de la Red Local (WiFi del Centro de Salud)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={ipLocal}
                    onChange={(e) => actualizarUrlConIP(e.target.value)}
                    placeholder="Ej: 192.168.1.50 o localhost"
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCopiarEnlace}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Si escanea desde un celular conectado al WiFi local, ingrese la IP de su PC (ej: 192.168.X.X).
              </p>
            </div>

            {/* Acciones */}
            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <a
                href={urlQR}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir enlace de prueba
              </a>
              <button
                type="button"
                onClick={() => setMostrarModalQR(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
