import { useState, useEffect } from 'react';
import {
  UserPlus, Users, Search, RefreshCw, Shield,
  Building2, Mail, Lock, CheckCircle2,
  Eye, EyeOff, X, KeyRound, AlertCircle
} from 'lucide-react';
import {
  cargarUsuarios as fetchUsuariosAPI,
  crearUsuario as postUsuarioAPI,
  cambiarEstadoUsuario as putEstadoAPI,
  cargarRoles as fetchRolesAPI,
  cargarEstablecimientos as fetchEstablecimientosAPI
} from '../services/api.js';

export default function GestionUsuarios({ activo = true }) {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [establecimientos, setEstablecimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTexto, setFiltroTexto] = useState('');
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    password: '',
    id_rol: 2,
    rol: 'Médico General',
    establecimiento: 'Hospital Nacional de Mazatenango',
    estado: 'ACTIVO'
  });

  const cargarDatos = async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const [listaUsuarios, listaRoles, listaEst] = await Promise.all([
        fetchUsuariosAPI(),
        fetchRolesAPI().catch(() => []),
        fetchEstablecimientosAPI().catch(() => [])
      ]);
      setUsuarios(Array.isArray(listaUsuarios) ? listaUsuarios : []);
      if (Array.isArray(listaRoles) && listaRoles.length > 0) setRoles(listaRoles);
      if (Array.isArray(listaEst) && listaEst.length > 0) setEstablecimientos(listaEst);
    } catch (err) {
      console.error('Error al cargar datos de usuarios:', err);
      setErrorMsg('Error al consultar la lista de usuarios en el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;

    if (activo) {
      Promise.all([
        fetchUsuariosAPI(),
        fetchRolesAPI().catch(() => []),
        fetchEstablecimientosAPI().catch(() => [])
      ])
        .then(([listaUsuarios, listaRoles, listaEst]) => {
          if (!cancelado) {
            setUsuarios(Array.isArray(listaUsuarios) ? listaUsuarios : []);
            if (Array.isArray(listaRoles) && listaRoles.length > 0) setRoles(listaRoles);
            if (Array.isArray(listaEst) && listaEst.length > 0) setEstablecimientos(listaEst);
          }
        })
        .catch((err) => {
          if (!cancelado) {
            console.error('Error al cargar datos de usuarios:', err);
            setErrorMsg('Error al consultar la lista de usuarios.');
          }
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }

    return () => {
      cancelado = true;
    };
  }, [activo]);

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setExitoMsg('');

    if (!form.nombres.trim() || !form.email.trim() || !form.password.trim()) {
      setErrorMsg('Los nombres, correo electrónico y contraseña son campos obligatorios.');
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg('La contraseña debe tener un mínimo de 6 caracteres.');
      return;
    }

    setGuardando(true);
    try {
      const res = await postUsuarioAPI(form);
      if (res && res.success) {
        setExitoMsg('Usuario registrado exitosamente en el sistema.');
        setMostrarModalNuevo(false);
        setForm({
          nombres: '',
          apellidos: '',
          email: '',
          password: '',
          rol: 'Médico General',
          establecimiento: 'Hospital Nacional de Mazatenango',
          estado: 'ACTIVO'
        });
        await cargarDatos();
      } else {
        setErrorMsg(res.message || 'Error al crear el usuario.');
      }
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setErrorMsg(err.message || 'Error de conexión con el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  const handleToggleEstado = async (usuario) => {
    const nuevoEstado = usuario.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await putEstadoAPI(usuario.id_usuario, nuevoEstado);
      setUsuarios(prev => prev.map(u => u.id_usuario === usuario.id_usuario ? { ...u, estado: nuevoEstado } : u));
    } catch (err) {
      console.error('Error al alternar estado:', err);
      alert('Error al modificar el estado del usuario.');
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const term = filtroTexto.toLowerCase().trim();
    if (!term) return true;
    const nombres = String(u.nombres || '').toLowerCase();
    const apellidos = String(u.apellidos || '').toLowerCase();
    const email = String(u.email || '').toLowerCase();
    const rol = String(u.rol || '').toLowerCase();
    const establecimiento = String(u.establecimiento || '').toLowerCase();
    return nombres.includes(term) || apellidos.includes(term) || email.includes(term) || rol.includes(term) || establecimiento.includes(term);
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">

      {/* 1. ENCABEZADO Y ACCIONES PRINCIPALES */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-sky-600 w-5 h-5" /> Administración de Usuarios y Accesos
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de cuentas institucionales, perfiles y asignación de personal de salud (DDRISS Suchitepéquez)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setErrorMsg('');
              setExitoMsg('');
              setMostrarModalNuevo(true);
            }}
            className="flex-1 md:flex-initial bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-bold text-xs px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Crear Nuevo Usuario
          </button>
          <button
            onClick={cargarDatos}
            title="Actualizar listado"
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2.5 rounded-xl transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. MENSAJES DE ALERTA */}
      {exitoMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-4 rounded-xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{exitoMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-900 text-xs p-4 rounded-xl flex items-center gap-2 font-bold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. BUSCADOR EN VIVO */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={filtroTexto}
            onChange={(e) => setFiltroTexto(e.target.value)}
            placeholder="Buscar por nombre, correo institucional, rol o establecimiento..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* 4. TABLA DE USUARIOS REGISTRADOS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Usuarios Registrados en el Sistema
            </h3>
          </div>
          <span className="text-[11px] font-bold text-slate-500">
            {usuariosFiltrados.length} usuario(s) encontrado(s)
          </span>
        </div>

        {cargando ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-sky-600" />
            <p>Cargando registro de usuarios...</p>
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No se encontraron usuarios con los criterios de búsqueda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/75 text-slate-700 uppercase text-[10px] font-extrabold tracking-wider border-b">
                <tr>
                  <th className="px-5 py-3.5">ID</th>
                  <th className="px-5 py-3.5">Nombre Completo</th>
                  <th className="px-5 py-3.5">Correo Institucional</th>
                  <th className="px-5 py-3.5">Rol en el Sistema</th>
                  <th className="px-5 py-3.5">Establecimiento Asignado</th>
                  <th className="px-5 py-3.5 text-center">Estado</th>
                  <th className="px-5 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usuariosFiltrados.map((u) => {
                  const esActivo = u.estado === 'ACTIVO' || u.estado === true;
                  const esAdmin = String(u.rol || '').toUpperCase().includes('ADMIN');
                  return (
                    <tr key={u.id_usuario} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-600">
                        #{u.id_usuario}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {u.nombres} {u.apellidos}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600">
                        {u.email}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wide border ${esAdmin
                            ? 'bg-purple-50 text-purple-900 border-purple-200'
                            : 'bg-sky-50 text-sky-900 border-sky-200'
                          }`}>
                          {u.rol}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 font-medium">
                        {u.establecimiento}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${esActivo
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}>
                          {esActivo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => handleToggleEstado(u)}
                          className={`text-xs font-bold px-3 py-1 rounded-lg border transition cursor-pointer ${esActivo
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-red-700'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                        >
                          {esActivo ? 'Desactivar' : 'Activar'}
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

      {/* 5. MODAL DE CREACIÓN DE USUARIO NUEVO */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-150 my-8">

            <div className="flex justify-between items-center border-b pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-sky-100 text-sky-700 rounded-2xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Crear Nuevo Usuario</h3>
                  <p className="text-xs text-slate-500">Registro de credenciales y asignación de rol institucional</p>
                </div>
              </div>
              <button
                onClick={() => setMostrarModalNuevo(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCrearUsuario} className="space-y-4 text-xs">

              {/* Nombres y Apellidos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Nombres *</label>
                  <input
                    type="text"
                    required
                    value={form.nombres}
                    onChange={(e) => setForm(prev => ({ ...prev, nombres: e.target.value }))}
                    placeholder="Ej. Carlos Eduardo"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Apellidos</label>
                  <input
                    type="text"
                    value={form.apellidos}
                    onChange={(e) => setForm(prev => ({ ...prev, apellidos: e.target.value }))}
                    placeholder="Ej. Gómez Morales"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                  />
                </div>
              </div>

              {/* Correo y Contraseña */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Correo Institucional *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="usuario@mspas.gob.gt"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Contraseña Inicial *</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={mostrarPassword ? "text" : "password"}
                      required
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rol Institucional */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Rol / Perfil en el Sistema *</label>
                <select
                  value={form.id_rol}
                  onChange={(e) => {
                    const id = parseInt(e.target.value, 10);
                    const rolObj = roles.find(r => r.id_rol === id);
                    setForm(prev => ({
                      ...prev,
                      id_rol: id,
                      rol: rolObj ? rolObj.nombre_rol : prev.rol
                    }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold text-slate-800 cursor-pointer"
                >
                  {roles.length > 0 ? (
                    roles.map(r => (
                      <option key={r.id_rol} value={r.id_rol}>
                        {r.nombre_rol} — {r.descripcion}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Administrador — Gestión total del sistema</option>
                      <option value={2}>Médico General — Evaluación y Boletas ARO</option>
                      <option value={3}>Gineco-Obstetra — Recepción hospitalaria</option>
                      <option value={4}>Enfermería Profesional — Triage y Signos</option>
                      <option value={5}>Técnico en Salud Rural — Captación comunitaria</option>
                      <option value={6}>Digitador de Admisión — Expedientes</option>
                    </>
                  )}
                </select>
              </div>

              {/* Establecimiento de Salud */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Establecimiento de Salud Asignado *</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <select
                    value={form.establecimiento}
                    onChange={(e) => setForm(prev => ({ ...prev, establecimiento: e.target.value }))}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800 cursor-pointer"
                  >
                    {establecimientos.length > 0 ? (
                      establecimientos.map(est => (
                        <option key={est.id_establecimiento} value={est.nombre_establecimiento}>
                          {est.nombre_establecimiento} ({est.municipio})
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Hospital Nacional de Mazatenango">Hospital Nacional de Mazatenango</option>
                        <option value="Centro de Salud Mazatenango (DDRISS)">Centro de Salud Mazatenango (DDRISS)</option>
                        <option value="Centro de Salud San Antonio Suchitepéquez">Centro de Salud San Antonio Suchitepéquez</option>
                        <option value="Centro de Salud Chicacao">Centro de Salud Chicacao</option>
                        <option value="Centro de Salud Cuyotenango">Centro de Salud Cuyotenango</option>
                        <option value="Centro de Salud Patulul">Centro de Salud Patulul</option>
                        <option value="Centro de Salud Santo Domingo Suchitepéquez">Centro de Salud Santo Domingo Suchitepéquez</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Botones de Envío */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{guardando ? 'Guardando...' : 'Crear Usuario'}</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
