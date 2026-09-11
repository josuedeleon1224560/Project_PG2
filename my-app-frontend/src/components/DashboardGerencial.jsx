import { useState, useEffect, useMemo } from 'react';
import {
  Activity, Users, ShieldAlert, CheckCircle, BarChart3,
  RefreshCw, Stethoscope, Calendar, XCircle,
  FileText, Filter, Scale, MapPin, Printer
} from 'lucide-react';
import { cargarEstadisticas as fetchEstadisticasAPI } from '../services/api.js';

export default function DashboardGerencial({ activo = true }) {
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [filtroMunicipio, setFiltroMunicipio] = useState('TODOS');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [pestañaFactores, setPestañaFactores] = useState('TODOS');
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  const cargarEstadisticas = async (overrideParams = null) => {
    setCargando(true);
    try {
      const params = overrideParams || {
        municipio: filtroMunicipio,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      };
      const data = await fetchEstadisticasAPI(params);
      if (data && data.success) {
        setEstadisticas(data);
        setUltimaActualizacion(new Date());
      }
    } catch (err) {
      console.error('Error al cargar estadísticas del tablero:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;

    if (activo) {
      fetchEstadisticasAPI({
        municipio: filtroMunicipio,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      })
        .then((data) => {
          if (!cancelado && data && data.success) {
            setEstadisticas(data);
            setUltimaActualizacion(new Date());
          }
        })
        .catch((err) => {
          if (!cancelado) console.error('Error al cargar estadísticas:', err);
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }

    return () => {
      cancelado = true;
    };
  }, [activo, filtroMunicipio, fechaInicio, fechaFin]);

  const resumen = estadisticas?.resumen || {
    total_gestantes: 0,
    total_evaluaciones: 0,
    total_aro: 0,
    total_bajo_riesgo: 0
  };

  const factores = estadisticas?.factores_criticos || {};
  const municipiosRaw = estadisticas?.distribucion_municipios || [];
  const nutricion = estadisticas?.distribucion_nutricional || {};
  const ultimasAlertas = estadisticas?.ultimas_alertas || [];

  const tasaARO = resumen.total_evaluaciones > 0
    ? ((resumen.total_aro / resumen.total_evaluaciones) * 100).toFixed(1)
    : '0.0';

  const tasaBajoRiesgo = resumen.total_evaluaciones > 0
    ? ((resumen.total_bajo_riesgo / resumen.total_evaluaciones) * 100).toFixed(1)
    : '0.0';

  // Municipios filtrados
  const municipiosFiltrados = useMemo(() => {
    if (filtroMunicipio === 'TODOS') return municipiosRaw;
    return municipiosRaw.filter(m => m.municipio === filtroMunicipio);
  }, [municipiosRaw, filtroMunicipio]);

  // Lista de Factores Epidemiológicos con Categorización y Porcentajes
  const listaFactores = useMemo(() => {
    const total = resumen.total_evaluaciones || 1;
    const items = [
      // Cat I
      { id: 'adolescentes', cat: 'I', label: 'Adolescentes (< 20 años)', valor: parseInt(factores.adolescentes || 0, 10), desc: 'Riesgo biológico e inmadurez pélvica' },
      { id: 'edad_avanzada', cat: 'I', label: 'Añosa (≥ 35 años)', valor: parseInt(factores.edad_avanzada || 0, 10), desc: 'Riesgo genético y comorbilidad' },
      { id: 'abortos_recurrentes', cat: 'I', label: 'Abortos Recurrentes (≥ 3)', valor: parseInt(factores.abortos_recurrentes || 0, 10), desc: 'Insuficiencia cervical / trombofilias' },
      { id: 'cesarea_previa', cat: 'I', label: 'Cesárea Previa', valor: parseInt(factores.cesarea_previa || 0, 10), desc: 'Riesgo de acretismo / rotura uterina' },
      { id: 'periodo_corto', cat: 'I', label: 'Periodo Intergenésico (< 2 años)', valor: parseInt(factores.periodo_corto || 0, 10), desc: 'Agotamiento de reservas maternas' },
      { id: 'gran_multipara', cat: 'I', label: 'Gran Multípara (≥ 4 partos)', valor: parseInt(factores.gran_multipara || 0, 10), desc: 'Atonía uterina y hemorragia posparto' },
      // Cat II
      { id: 'hipertension', cat: 'II', label: 'Hipertensión / Preeclampsia', valor: parseInt(factores.hipertension || 0, 10), desc: 'PA ≥ 140/90 mmHg o HTA crónica' },
      { id: 'diabetes', cat: 'II', label: 'Diabetes Previa o Gestacional', valor: parseInt(factores.diabetes || 0, 10), desc: 'Macrosomía y morbimortalidad perinatal' },
      { id: 'hemorragias', cat: 'II', label: 'Hemorragia Obstétrica Activa', valor: parseInt(factores.hemorragias || 0, 10), desc: 'Amenaza de aborto o desprendimiento' },
      { id: 'ruptura_membranas', cat: 'II', label: 'Ruptura Prematura de Membranas', valor: parseInt(factores.ruptura_membranas || 0, 10), desc: 'Riesgo de corioamnionitis y sepsis' },
      { id: 'itu', cat: 'II', label: 'Infección Urinaria Recurrente', valor: parseInt(factores.itu || 0, 10), desc: 'Disparador de amenaza de parto pretérmino' },
      // Cat III
      { id: 'talla_baja', cat: 'III', label: 'Talla Baja (< 145 cm)', valor: parseInt(factores.talla_baja || 0, 10), desc: 'Desproporción cefalopélvica' },
      { id: 'desnutricion', cat: 'III', label: 'Desnutrición Materna (IMC < 18.5)', valor: parseInt(factores.desnutricion || 0, 10), desc: 'Restricción de crecimiento fetal' },
      { id: 'obesidad', cat: 'III', label: 'Obesidad Materna (IMC ≥ 30.0)', valor: parseInt(factores.obesidad || 0, 10), desc: 'Resistencia a insulina y complicaciones' },
      { id: 'anemia', cat: 'III', label: 'Anemia Materna (Hb < 11 g/dL)', valor: parseInt(factores.anemia || 0, 10), desc: 'Hipoxia tisular y riesgo de shock' },
      { id: 'sin_control', cat: 'III', label: 'Sin Control Prenatal Oportuno', valor: parseInt(factores.sin_control_oportuno || 0, 10), desc: 'Captación tardía en 1T/2T' },
      { id: 'vulnerabilidad', cat: 'III', label: 'Vulnerabilidad / Violencia', valor: parseInt(factores.vulnerabilidad_violencia || 0, 10), desc: 'Barreras sociales críticas' }
    ];

    return items.map(item => ({
      ...item,
      porcentaje: ((item.valor / total) * 100).toFixed(1)
    }));
  }, [factores, resumen.total_evaluaciones]);

  const factoresFiltrados = useMemo(() => {
    if (pestañaFactores === 'TODOS') return listaFactores;
    return listaFactores.filter(f => f.cat === pestañaFactores);
  }, [listaFactores, pestañaFactores]);

  // Totales Nutricionales
  const totalNutricional = (
    parseInt(nutricion.desnutricion || 0, 10) +
    parseInt(nutricion.normal || 0, 10) +
    parseInt(nutricion.sobrepeso || 0, 10) +
    parseInt(nutricion.obesidad || 0, 10)
  ) || 1;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* 1. ENCABEZADO Y CONTROL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Activity className="text-sky-600 w-6 h-6" /> Tablero de Vigilancia Epidemiológica y Alerta ARO
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS) de Suchitepéquez — Hospital Nacional de Mazatenango
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">

          {/* Selector de Municipio */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="bg-transparent outline-none font-semibold text-slate-800 cursor-pointer"
            >
              <option value="TODOS">Todos los Municipios</option>
              {municipiosRaw.map(m => (
                <option key={m.municipio} value={m.municipio}>{m.municipio}</option>
              ))}
            </select>
          </div>

          {/* Rango de Fechas: Desde */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Desde:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="bg-transparent outline-none font-semibold text-slate-800 cursor-pointer text-xs"
            />
          </div>

          {/* Rango de Fechas: Hasta */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-500 uppercase">Hasta:</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="bg-transparent outline-none font-semibold text-slate-800 cursor-pointer text-xs"
            />
          </div>

          {/* Botón Limpiar Filtros si hay alguno activo */}
          {(filtroMunicipio !== 'TODOS' || fechaInicio || fechaFin) && (
            <button
              onClick={() => {
                setFiltroMunicipio('TODOS');
                setFechaInicio('');
                setFechaFin('');
              }}
              title="Restablecer todos los filtros"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
            >
              <XCircle className="w-4 h-4 text-slate-500" />
            </button>
          )}

          {/* Descargar PDF con Filtros Aplicados */}
          <button
            onClick={() => {
              const q = new URLSearchParams();
              if (filtroMunicipio && filtroMunicipio !== 'TODOS') q.append('municipio', filtroMunicipio);
              if (fechaInicio) q.append('fecha_inicio', fechaInicio);
              if (fechaFin) q.append('fecha_fin', fechaFin);
              const qs = q.toString() ? `?${q.toString()}` : '';
              window.open(`http://localhost:4000/api/dashboard/informe-pdf${qs}`, '_blank');
            }}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Descargar Informe PDF</span>
          </button>

          {/* Actualizar Manual */}
          <button
            onClick={() => cargarEstadisticas()}
            disabled={cargando}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* 2. TARJETAS DE INDICADORES CLAVE (KPIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Gestantes Registradas</span>
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{resumen.total_gestantes}</span>
            <span className="text-xs text-slate-400 block mt-0.5 font-medium">Expedientes en Suchitepéquez</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-sky-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Evaluaciones Prenatales</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{resumen.total_evaluaciones}</span>
            <span className="text-xs text-slate-400 block mt-0.5 font-medium">Fichas ARO completadas</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: '100%' }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-sm flex flex-col justify-between space-y-3 bg-gradient-to-br from-red-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-900 uppercase tracking-wide">Casos ARO Detectados</span>
            <div className="p-2.5 rounded-xl bg-red-100 text-red-600">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-red-600">{resumen.total_aro}</span>
              <span className="text-xs font-extrabold bg-red-200 text-red-950 px-2 py-0.5 rounded-full">
                {tasaARO}%
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-0.5 font-medium">Referencias al Hospital Mazatenango</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-red-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(parseFloat(tasaARO), 100)}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm flex flex-col justify-between space-y-3 bg-gradient-to-br from-emerald-50/40 to-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Bajo Riesgo Obstétrico</span>
            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700">{resumen.total_bajo_riesgo}</span>
              <span className="text-xs font-extrabold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
                {tasaBajoRiesgo}%
              </span>
            </div>
            <span className="text-xs text-slate-500 block mt-0.5 font-medium">Control en 1er nivel de salud</span>
          </div>
          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(parseFloat(tasaBajoRiesgo), 100)}%` }} />
          </div>
        </div>

      </div>

      {/* 3. FACTORES DE RIESGO Y DISTRIBUCIÓN TERRITORIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* 3.1 DESGLOSE DE FACTORES DE RIESGO NORMADOS */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-sky-600" /> Prevalencia de Factores ARO Normados
            </h3>
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setPestañaFactores('TODOS')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${pestañaFactores === 'TODOS' ? 'bg-white shadow-xs text-slate-900 font-extrabold' : 'text-slate-500'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setPestañaFactores('I')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${pestañaFactores === 'I' ? 'bg-white shadow-xs text-sky-900 font-extrabold' : 'text-slate-500'}`}
              >
                Cat I
              </button>
              <button
                type="button"
                onClick={() => setPestañaFactores('II')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${pestañaFactores === 'II' ? 'bg-white shadow-xs text-red-900 font-extrabold' : 'text-slate-500'}`}
              >
                Cat II
              </button>
              <button
                type="button"
                onClick={() => setPestañaFactores('III')}
                className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${pestañaFactores === 'III' ? 'bg-white shadow-xs text-amber-900 font-extrabold' : 'text-slate-500'}`}
              >
                Cat III
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {factoresFiltrados.map(f => (
              <div key={f.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 hover:bg-slate-100/70 transition">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{f.label}</span>
                    <span className="text-[10px] text-slate-400 block">{f.desc}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-black text-slate-900 text-sm">{f.valor}</span>
                    <span className="text-[11px] text-slate-500 ml-1.5 font-bold">({f.porcentaje}%)</span>
                  </div>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${f.cat === 'II' ? 'bg-red-500' : f.cat === 'I' ? 'bg-sky-600' : 'bg-amber-500'}`}
                    style={{ width: `${Math.min(parseFloat(f.porcentaje) * 2, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3.2 DISTRIBUCIÓN TERRITORIAL Y NUTRICIONAL */}
        <div className="lg:col-span-5 space-y-6">

          {/* Territorial */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-sky-600" /> Distribución por Municipio
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Suchitepéquez</span>
            </div>

            {municipiosFiltrados.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No hay evaluaciones registradas para el filtro seleccionado.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
                {municipiosFiltrados.map((m) => {
                  const totalMun = parseInt(m.total_evaluaciones || 0, 10);
                  const aroMun = parseInt(m.total_aro || 0, 10);
                  const pctAro = totalMun > 0 ? ((aroMun / totalMun) * 100).toFixed(0) : 0;
                  return (
                    <div key={m.municipio} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{m.municipio}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-semibold">{totalMun} eval.</span>
                          <span className="bg-red-100 text-red-900 font-black px-2 py-0.5 rounded-md text-[10px]">
                            {aroMun} ARO ({pctAro}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex">
                        <div className="bg-red-500 h-full" style={{ width: `${pctAro}%` }} />
                        <div className="bg-emerald-500 h-full" style={{ width: `${100 - pctAro}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Nutricional */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-600" /> Perfil Nutricional Materno (IMC)
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Clasificación MSPAS</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-slate-500 block text-[10px] font-bold">Desnutrición (&lt; 18.5)</span>
                <span className="text-base font-black text-amber-900">{nutricion.desnutricion || 0}</span>
                <span className="text-[10px] text-amber-800 block mt-0.5">
                  ({(((parseInt(nutricion.desnutricion || 0, 10)) / totalNutricional) * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-slate-500 block text-[10px] font-bold">Normal (18.5 - 24.9)</span>
                <span className="text-base font-black text-emerald-900">{nutricion.normal || 0}</span>
                <span className="text-[10px] text-emerald-800 block mt-0.5">
                  ({(((parseInt(nutricion.normal || 0, 10)) / totalNutricional) * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200">
                <span className="text-slate-500 block text-[10px] font-bold">Sobrepeso (25.0 - 29.9)</span>
                <span className="text-base font-black text-sky-900">{nutricion.sobrepeso || 0}</span>
                <span className="text-[10px] text-sky-800 block mt-0.5">
                  ({(((parseInt(nutricion.sobrepeso || 0, 10)) / totalNutricional) * 100).toFixed(0)}%)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200">
                <span className="text-slate-500 block text-[10px] font-bold">Obesidad (≥ 30.0)</span>
                <span className="text-base font-black text-red-900">{nutricion.obesidad || 0}</span>
                <span className="text-[10px] text-red-800 block mt-0.5">
                  ({(((parseInt(nutricion.obesidad || 0, 10)) / totalNutricional) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* 4. TABLA DE ÚLTIMAS EVALUACIONES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800">
              Últimas Evaluaciones y Boletas Emitidas en Suchitepéquez
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 font-semibold">
            Sincronizado: {ultimaActualizacion.toLocaleTimeString()}
          </span>
        </div>

        {ultimasAlertas.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No se han registrado evaluaciones recientemente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">Ficha / Código</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3">CUI / DPI</th>
                  <th className="px-4 py-3">Municipio</th>
                  <th className="px-4 py-3">Signos / Semanas</th>
                  <th className="px-4 py-3">Dictamen</th>
                  <th className="px-4 py-3 text-right">Boleta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ultimasAlertas.map((item) => {
                  const esAro = Boolean(item.es_aro);
                  return (
                    <tr key={item.id_ficha} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-slate-800">
                        REF-SUCH-2026-00{item.id_ficha}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {item.nombres} {item.apellidos}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">
                        {item.cui_dpi}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.municipio || 'Suchitepéquez'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {item.semanas_gestacion} sem | PA: {item.presion_sistolica}/{item.presion_diastolica}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${esAro ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          }`}>
                          {esAro ? 'ALTO RIESGO (ARO)' : 'BAJO RIESGO'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {esAro ? (
                          <button
                            onClick={() => window.open(`http://localhost:4000/api/fichas/boleta/${item.id_ficha}/pdf`, '_blank')}
                            className="text-slate-900 hover:text-sky-700 font-bold flex items-center gap-1 ml-auto text-xs cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" /> PDF
                          </button>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">No aplica</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
