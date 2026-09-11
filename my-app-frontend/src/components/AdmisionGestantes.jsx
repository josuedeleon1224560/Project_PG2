import { useState, useEffect } from 'react';
import {
  UserPlus, Search, Users, RefreshCw,
  Stethoscope, Building2, AlertCircle
} from 'lucide-react';
import { cargarPacientes as fetchPacientesAPI, crearPaciente as postPacienteAPI } from '../services/api.js';

const MUNICIPIOS_SUCHITEPEQUEZ = [
  'Mazatenango',
  'San Antonio Suchitepéquez',
  'Chicacao',
  'Cuyotenango',
  'Patulul',
  'San Bernardino',
  'Samayac',
  'Santo Domingo Suchitepéquez',
  'San Gabriel',
  'San Lorenzo',
  'San Miguel Panán',
  'San Pablo Jocopilas',
  'Santa Bárbara',
  'Santo Tomás La Unión',
  'Zunilito',
  'Pueblo Nuevo',
  'Río Bravo'
];

export default function AdmisionGestantes({ activo = true, onSeleccionarParaARO }) {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
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

  const cargarPacientes = async () => {
    setCargando(true);
    try {
      const lista = await fetchPacientesAPI();
      setPacientes(Array.isArray(lista) ? lista : []);
    } catch (err) {
      console.error('Error al cargar pacientes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;

    if (activo) {
      fetchPacientesAPI()
        .then((lista) => {
          if (!cancelado) {
            setPacientes(Array.isArray(lista) ? lista : []);
          }
        })
        .catch((err) => {
          if (!cancelado) console.error('Error al cargar pacientes:', err);
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }

    return () => {
      cancelado = true;
    };
  }, [activo]);

  const handleCrearPaciente = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (form.cui_dpi.length !== 13) {
      setErrorMsg('El CUI/DPI debe contener exactamente 13 dígitos numéricos.');
      return;
    }

    setGuardando(true);
    try {
      const data = await postPacienteAPI(form);

      if (data && data.paciente) {
        setMostrarModalNuevo(false);
        setForm({
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
        await cargarPacientes();
        alert('Expediente de gestante registrado con éxito en la base de datos institucional.');
      } else {
        setErrorMsg(data.message || 'Error al registrar el expediente.');
      }
    } catch (err) {
      console.error('Error al crear expediente:', err);
      setErrorMsg(err.message || 'Error al procesar el registro del expediente.');
    } finally {
      setGuardando(false);
    }
  };

  const pacientesFiltrados = pacientes.filter(p => {
    const term = filtroTexto.toLowerCase().trim();
    if (!term) return true;
    const cui = String(p.cui_dpi || p.dpi_cui || '').toLowerCase();
    const nombres = String(p.nombres || '').toLowerCase();
    const apellidos = String(p.apellidos || '').toLowerCase();
    const municipio = String(p.municipio || '').toLowerCase();
    return cui.includes(term) || nombres.includes(term) || apellidos.includes(term) || municipio.includes(term);
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* Barra de Encabezado y Control */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="text-sky-600 w-5 h-5" /> Admisión y Registro Único de Gestantes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Módulo de ingreso y control de expedientes de salud materno-neonatal (DDRISS Suchitepéquez)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setMostrarModalNuevo(true)}
            className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Nuevo Expediente
          </button>
          <button
            onClick={cargarPacientes}
            title="Actualizar listado"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Buscador de Gestantes Registradas */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Filtrar por CUI / DPI (13 dígitos), nombre, apellidos o municipio..."
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Tabla de Expedientes Registrados */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800">
            Expedientes Registrados ({pacientesFiltrados.length})
          </span>
          <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> Red de Servicios Suchitepéquez
          </span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-slate-400 font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
            Cargando expedientes de la base de datos...
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No se encontraron expedientes registrados con el criterio especificado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b">
                <tr>
                  <th className="px-4 py-3">CUI / DPI</th>
                  <th className="px-4 py-3">Nombre Completo</th>
                  <th className="px-4 py-3">F. Nacimiento</th>
                  <th className="px-4 py-3">Municipio / Comunidad</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Historial Obstétrico</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pacientesFiltrados.map((p) => {
                  const cui = p.cui_dpi || p.dpi_cui;
                  return (
                    <tr key={p.id_paciente || cui} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-sky-950">
                        {cui}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900">
                        {p.nombres} {p.apellidos}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.fecha_nacimiento ? String(p.fecha_nacimiento).substring(0, 10) : 'N/D'}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <span className="font-semibold text-slate-800">{p.municipio || 'No indicado'}</span>
                        {p.comunidad ? <span className="block text-[11px] text-slate-400">{p.comunidad}</span> : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {p.telefono || 'Sin teléfono'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-semibold">
                        G:{p.gestas_previas || 0} | P:{p.partos_previos || 0} | C:{p.cesareas_previas || 0} | A:{p.abortos_previos || 0}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onSeleccionarParaARO && onSeleccionarParaARO(p)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg text-[11px] transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Stethoscope className="w-3.5 h-3.5" /> Evaluar ARO
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registrar Nuevo Expediente */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="text-sky-600 w-5 h-5" /> Admisión de Nueva Gestante
              </h3>
              <button
                onClick={() => setMostrarModalNuevo(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold text-base"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-4">
              Complete los datos del expediente único para registrar a la paciente en la base de datos SIREP_MSPAS.
            </p>

            {errorMsg && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-800 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCrearPaciente} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">CUI / DPI (13 dígitos) *</label>
                  <input
                    type="text"
                    required
                    maxLength={13}
                    value={form.cui_dpi}
                    onChange={(e) => setForm({ ...form, cui_dpi: e.target.value.replace(/\D/g, '') })}
                    placeholder="Ej. 2912354091001"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Fecha de Nacimiento *</label>
                  <input
                    type="date"
                    required
                    value={form.fecha_nacimiento}
                    onChange={(e) => setForm({ ...form, fecha_nacimiento: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={form.nombres}
                    onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. Carmen Lucía"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={form.apellidos}
                    onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. Morales Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Municipio *</label>
                  <select
                    required
                    value={form.municipio}
                    onChange={(e) => setForm({ ...form, municipio: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                  >
                    <option value="">Seleccione municipio...</option>
                    {MUNICIPIOS_SUCHITEPEQUEZ.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Comunidad / Aldea / Cantón</label>
                  <input
                    type="text"
                    value={form.comunidad}
                    onChange={(e) => setForm({ ...form, comunidad: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                    placeholder="Ej. Aldea El Compromiso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Teléfono de Contacto</label>
                  <input
                    type="tel"
                    value={form.telefono}
                    onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                    placeholder="Ej. 55551234"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Dirección Exacta</label>
                  <input
                    type="text"
                    value={form.direccion}
                    onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                    placeholder="Ej. Sector 2, Lote 14"
                    className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Gestas Previas</label>
                  <input
                    type="number"
                    min={0}
                    value={form.gestas_previas}
                    onChange={(e) => setForm({ ...form, gestas_previas: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Partos Previos</label>
                  <input
                    type="number"
                    min={0}
                    value={form.partos_previos}
                    onChange={(e) => setForm({ ...form, partos_previos: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Cesáreas Previas</label>
                  <input
                    type="number"
                    min={0}
                    value={form.cesareas_previas}
                    onChange={(e) => setForm({ ...form, cesareas_previas: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Abortos Previos</label>
                  <input
                    type="number"
                    min={0}
                    value={form.abortos_previos}
                    onChange={(e) => setForm({ ...form, abortos_previos: e.target.value })}
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold"
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
                  disabled={guardando}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Crear Expediente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
