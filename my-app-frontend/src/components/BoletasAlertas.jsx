import { useState, useEffect } from 'react';
import {
  FileText, Send, Printer, CheckCircle2,
  Building2, RefreshCw, Filter
} from 'lucide-react';
import {
  cargarHistorialBoletas as fetchBoletasAPI,
  despacharAlertaWhatsApp as apiDespacharWhatsApp,
  despacharAlertaEmail as apiDespacharEmail
} from '../services/api.js';

export default function BoletasAlertas({ activo = true }) {
  const [fichas, setFichas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
  const [filtroSoloAro, setFiltroSoloAro] = useState(false);

  const cargarFichas = async () => {
    setCargando(true);
    try {
      const lista = await fetchBoletasAPI();
      const listaSegura = Array.isArray(lista) ? lista : [];
      setFichas(listaSegura);
      if (listaSegura.length > 0) {
        setBoletaSeleccionada(prev => {
          if (!prev) return listaSegura[0];
          const sigueExistiendo = listaSegura.find(f => f.id_ficha === prev.id_ficha);
          return sigueExistiendo || listaSegura[0];
        });
      }
    } catch (err) {
      console.error('Error al cargar historial de boletas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;

    if (activo) {
      fetchBoletasAPI()
        .then((lista) => {
          if (cancelado) return;
          const listaSegura = Array.isArray(lista) ? lista : [];
          setFichas(listaSegura);
          if (listaSegura.length > 0) {
            setBoletaSeleccionada((prev) => {
              if (!prev) return listaSegura[0];
              const sigueExistiendo = listaSegura.find(f => f.id_ficha === prev.id_ficha);
              return sigueExistiendo || listaSegura[0];
            });
          }
        })
        .catch((err) => {
          if (!cancelado) console.error('Error al consultar boletas:', err);
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }

    return () => {
      cancelado = true;
    };
  }, [activo]);

  const listaFiltrada = fichas.filter(f => {
    const esAro = Boolean(f.es_aro);
    if (filtroSoloAro) return esAro;
    return true;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* Encabezado del Módulo */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="text-sky-600 w-5 h-5" /> Boletas de Referencia ARO y Alertas Hospitalarias
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Despacho oficial de contrarreferencias hacia el Hospital Nacional de Mazatenango y cola de alertas
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFiltroSoloAro(!filtroSoloAro)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer ${filtroSoloAro
              ? 'bg-red-50 text-red-700 border-red-200'
              : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{filtroSoloAro ? 'Mostrando solo Casos ARO' : 'Mostrando Todas las Fichas'}</span>
          </button>

          <button
            onClick={cargarFichas}
            title="Actualizar datos"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Grilla Principal: Lista de Boletas a la izquierda, Vista de Boleta a la derecha */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LISTADO DE BOLETAS EMITIDAS */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Registro de Referencias</span>
              <span className="text-[11px] font-semibold text-slate-500">
                {listaFiltrada.length} registrada(s)
              </span>
            </h3>

            {cargando ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-sky-600" />
                Consultando historial...
              </div>
            ) : listaFiltrada.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No se registran evaluaciones con los filtros actuales.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
                {listaFiltrada.map((f) => {
                  const esSeleccionada = boletaSeleccionada?.id_ficha === f.id_ficha;
                  return (
                    <div
                      key={f.id_ficha}
                      onClick={() => setBoletaSeleccionada(f)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer text-xs space-y-1.5 ${esSeleccionada
                        ? 'border-sky-500 bg-sky-50/50 shadow-sm ring-1 ring-sky-300'
                        : f.es_aro
                          ? 'border-red-200 hover:border-red-300 bg-white'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-bold text-slate-900">
                          {f.nombres} {f.apellidos}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${f.es_aro ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                          {f.es_aro ? 'ARO' : 'BAJO RIESGO'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>CUI: {f.cui_dpi}</span>
                        <span>{f.semanas_gestacion} sem</span>
                      </div>

                      <div className="text-[11px] text-slate-600 flex justify-between items-center pt-1 border-t border-slate-100">
                        <span>{f.municipio || 'Suchitepéquez'}</span>
                        <span className="font-mono text-slate-400">
                          Ficha #{f.id_ficha}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* DETALLE Y VISTA OFICIAL DE LA BOLETA */}
        <div className="lg:col-span-7">
          {boletaSeleccionada ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">

              {/* Encabezado Oficial */}
              <div className="border-b pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest block">
                    Ministerio de Salud Pública y Asistencia Social (MSPAS)
                  </span>
                  <h3 className="text-base font-black text-slate-900">
                    Boleta Oficial de Referencia Obstétrica (ARO)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dirección Departamental de Redes Integradas de Servicios de Salud de Suchitepéquez
                  </p>
                </div>

                <div className="text-right sm:self-auto">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Código de Referencia</span>
                  <span className="text-sm font-mono font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                    REF-SUCH-2026-00{boletaSeleccionada.id_ficha}
                  </span>
                </div>
              </div>

              {/* Datos de la Gestante y Destino */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block font-semibold">Paciente</span>
                  <span className="font-bold text-slate-800">{boletaSeleccionada.nombres} {boletaSeleccionada.apellidos}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">CUI / DPI</span>
                  <span className="font-bold text-slate-800">{boletaSeleccionada.cui_dpi}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Municipio</span>
                  <span className="font-bold text-slate-800">{boletaSeleccionada.municipio || 'Suchitepéquez'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Sem. Gestación</span>
                  <span className="font-bold text-slate-800">{boletaSeleccionada.semanas_gestacion} semanas</span>
                </div>
              </div>

              {/* Signos Vitales al Momento de la Evaluación */}
              <div className="space-y-2 text-xs">
                <span className="font-bold text-slate-800 uppercase tracking-wider block text-[11px]">
                  Signos Vitales y Biometría Registrada
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 text-center">
                  <div className="bg-white border rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-400 block">P. Arterial</span>
                    <span className="font-extrabold text-slate-900">
                      {boletaSeleccionada.presion_sistolica}/{boletaSeleccionada.presion_diastolica}
                    </span>
                  </div>
                  <div className="bg-white border rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-400 block">IMC</span>
                    <span className="font-extrabold text-slate-900">
                      {boletaSeleccionada.imc ? `${boletaSeleccionada.imc} kg/m²` : 'N/D'}
                    </span>
                  </div>
                  <div className="bg-white border rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-400 block">Peso</span>
                    <span className="font-extrabold text-slate-900">
                      {boletaSeleccionada.peso_kg ? `${boletaSeleccionada.peso_kg} kg` : 'N/D'}
                    </span>
                  </div>
                  <div className="bg-white border rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-400 block">Talla</span>
                    <span className="font-extrabold text-slate-900">
                      {boletaSeleccionada.talla_cm ? `${boletaSeleccionada.talla_cm} cm` : 'N/D'}
                    </span>
                  </div>
                  <div className="bg-white border rounded-xl p-2.5">
                    <span className="text-[10px] text-slate-400 block">FC Fetal</span>
                    <span className="font-extrabold text-slate-900">
                      {boletaSeleccionada.frecuencia_cardiaca_fetal ? `${boletaSeleccionada.frecuencia_cardiaca_fetal} lpm` : 'N/D'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Destino y Diagnóstico de Referencia */}
              <div className="bg-red-50/70 border border-red-200 rounded-2xl p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-950 flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-red-600" /> Hospital de Referencia:
                  </span>
                  <span className="font-black text-red-900">
                    Hospital Nacional de Mazatenango
                  </span>
                </div>
                <p className="text-slate-700">
                  <strong>Criterio de Referencia:</strong> Identificación de factores normados de Alto Riesgo Obstétrico (ARO). Requiere atención especializada de segundo/tercer nivel.
                </p>
                {boletaSeleccionada.observaciones_clinicas && (
                  <p className="text-slate-700 italic pt-1 border-t border-red-200/60">
                    <strong>Observaciones:</strong> {boletaSeleccionada.observaciones_clinicas}
                  </p>
                )}
              </div>

              {/* Estado de Alertas Externas y Despacho */}
              <div className="border-t pt-4 space-y-3 text-xs">
                <span className="font-bold text-slate-800 block text-[11px] uppercase">
                  Canales de Alerta y Despacho Institucional
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Canal WhatsApp */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-emerald-600" />
                        <span className="font-bold text-xs">WhatsApp Business MSPAS</span>
                      </div>
                      <span className="text-[10px] font-black bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
                        ACTIVO
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      Notificación inmediata a la jefatura de guardia del Hospital Nacional de Mazatenango.
                    </p>
                    <button
                      onClick={async () => {
                        const id = boletaSeleccionada?.id_ficha;
                        if (!id) return;
                        try {
                          const data = await apiDespacharWhatsApp(id);
                          if (data.linkWhatsApp) {
                            window.open(data.linkWhatsApp, '_blank');
                          }
                          alert(data.message || 'Alerta estructurada enviada a WhatsApp.');
                        } catch (e) {
                          console.error(e);
                          alert('Error al procesar la alerta de WhatsApp.');
                        }
                      }}
                      className="mt-1 w-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" /> Enviar Alerta WhatsApp
                    </button>
                  </div>

                  {/* Canal SMTP Email */}
                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-sky-50/70 border border-sky-200 text-sky-950 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-sky-600" />
                        <span className="font-bold text-xs">Servidor SMTP Mazatenango</span>
                      </div>
                      <span className="text-[10px] font-black bg-sky-200 text-sky-950 px-2 py-0.5 rounded-full">
                        CONFIGURADO
                      </span>
                    </div>
                    <p className="text-[11px] text-sky-800">
                      Despacho oficial de la Boleta con PDF adjunto al correo de recepción hospitalaria.
                    </p>
                    <button
                      onClick={async () => {
                        const id = boletaSeleccionada?.id_ficha;
                        if (!id) return;
                        try {
                          const data = await apiDespacharEmail(id);
                          alert(data.message || 'Boleta enviada exitosamente por correo electrónico.');
                        } catch (e) {
                          console.error(e);
                          alert('Error al enviar correo.');
                        }
                      }}
                      className="mt-1 w-full py-2 bg-sky-700 hover:bg-sky-800 active:scale-[0.99] text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" /> Despachar por Correo (PDF)
                    </button>
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    const id = boletaSeleccionada?.id_ficha;
                    if (id) {
                      window.open(`http://localhost:4000/api/fichas/boleta/${id}/pdf`, '_blank');
                    } else {
                      alert('Seleccione una boleta del listado para descargar el documento.');
                    }
                  }}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Descargar / Imprimir Boleta PDF
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center text-xs text-slate-400">
              Seleccione una boleta o evaluación del listado para ver su detalle oficial.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
