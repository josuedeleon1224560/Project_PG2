import { useState, useMemo, useEffect } from 'react';
import AdmisionGestantes from './components/AdmisionGestantes';
import CapturaEpidemiologica from './components/CapturaEpidemiologica';
import BoletasAlertas from './components/BoletasAlertas';
import DashboardGerencial from './components/DashboardGerencial';
import GestionUsuarios from './components/GestionUsuarios';
import Login from './components/Login';
import {
  Users, Stethoscope, FileText, BarChart3,
  LogOut, User, Shield
} from 'lucide-react';
import { obtenerBorradorMovil } from './services/api';

export default function App() {
  // Inicialización diferida (lazy state) para evitar setState sincrónico en efectos
  const [usuario, setUsuario] = useState(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('usuario');
      if (storedToken && storedUser) {
        return JSON.parse(storedUser);
      }
    } catch (e) {
      console.warn('Error al leer sesión almacenada:', e);
    }
    return null;
  });

  // Detección de sesión móvil por escaneo de Código QR
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const borradorQRInicial = useMemo(() => urlParams.get('borrador') || null, [urlParams]);
  const modoMovilInicial = useMemo(() => urlParams.get('modo') === 'movil' || Boolean(borradorQRInicial), [urlParams, borradorQRInicial]);

  const [cargandoSesionQR, setCargandoSesionQR] = useState(() => Boolean(borradorQRInicial && !usuario));

  const [moduloActivo, setModuloActivo] = useState(() => {
    if (borradorQRInicial || modoMovilInicial) {
      return 'captura';
    }
    return 'admision';
  });
  const [pacienteParaARO, setPacienteParaARO] = useState(null);

  const autenticado = Boolean(usuario);

  // Auto-autenticación y carga de borrador cuando se accede desde escaneo QR en teléfono
  useEffect(() => {
    let cancelado = false;
    if (borradorQRInicial && !usuario) {
      obtenerBorradorMovil(borradorQRInicial)
        .then((data) => {
          if (!cancelado && data && data.success) {
            if (data.jwtToken) {
              localStorage.setItem('token', data.jwtToken);
            }
            if (data.usuario) {
              localStorage.setItem('usuario', JSON.stringify(data.usuario));
              setUsuario(data.usuario);
            } else {
              const sesionClinica = {
                id_usuario: 1,
                nombres: 'Personal de Salud',
                apellidos: '(Móvil)',
                nombre_rol: 'Personal de Salud'
              };
              localStorage.setItem('usuario', JSON.stringify(sesionClinica));
              setUsuario(sesionClinica);
            }
            setModuloActivo('captura');
          }
        })
        .catch((err) => {
          if (!cancelado) {
            console.error('Error al sincronizar sesión QR:', err);
          }
        })
        .finally(() => {
          if (!cancelado) {
            setCargandoSesionQR(false);
          }
        });
    }

    return () => {
      cancelado = true;
    };
  }, [borradorQRInicial, usuario]);

  const esAdmin = useMemo(() => {
    const idRol = parseInt(usuario?.id_rol || 0, 10);
    const rol = String(usuario?.nombre_rol || usuario?.rol || '').toUpperCase();
    return idRol === 1 || rol.includes('ADMIN');
  }, [usuario]);

  const puedeVerDashboard = useMemo(() => {
    const idRol = parseInt(usuario?.id_rol || 0, 10);
    const rol = String(usuario?.nombre_rol || usuario?.rol || '').toUpperCase();
    return idRol === 1 || idRol === 2 || rol.includes('ADMIN') || rol.includes('MEDIC') || rol.includes('MÉDIC');
  }, [usuario]);

  const modulos = useMemo(() => {
    const base = [
      { id: 'admision', nombre: '1. Admisión de Gestantes', icono: Users, desc: 'Expediente Único' },
      { id: 'captura', nombre: '2. Ficha ARO (25 Indicadores)', icono: Stethoscope, desc: 'Evaluación Prenatal' },
      { id: 'boletas', nombre: '3. Boletas ARO & Alertas', icono: FileText, desc: 'Referencias MSPAS' }
    ];

    if (puedeVerDashboard) {
      base.push({ id: 'dashboard', nombre: '4. Tablero DDRISS', icono: BarChart3, desc: 'Vigilancia Epidemiológica' });
    }

    if (esAdmin) {
      base.push({ id: 'usuarios', nombre: '5. Administración de Usuarios', icono: Shield, desc: 'Gestión de Cuentas' });
    }

    return base;
  }, [puedeVerDashboard, esAdmin]);

  const handleLoginSuccess = (userData) => {
    setUsuario(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    setPacienteParaARO(null);
  };

  useEffect(() => {
    const onAutoLogout = () => {
      setUsuario(null);
      setPacienteParaARO(null);
    };
    window.addEventListener('sirep:logout', onAutoLogout);
    return () => window.removeEventListener('sirep:logout', onAutoLogout);
  }, []);

  const handleSeleccionarPacienteARO = (paciente) => {
    setPacienteParaARO(paciente);
    setModuloActivo('captura');
  };

  if (cargandoSesionQR) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-extrabold text-base">Sincronizando Ficha Clínica desde Código QR...</p>
        <p className="text-xs text-slate-400 mt-1">SIREP MSPAS - Suchitepéquez</p>
      </div>
    );
  }

  if (!autenticado) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">

      {/* 1. Header Institucional Superior */}
      <header className="bg-slate-900 text-white px-4 sm:px-8 py-3.5 flex flex-wrap justify-between items-center gap-4 shadow-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center font-black text-lg tracking-wider shadow-inner">
            G
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-wide flex items-center gap-2">
              SIREP - Suchitepéquez
              <span className="text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded-full">
                MSPAS
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Dirección Departamental de Redes Integradas de Servicios de Salud (DDRISS)
            </p>
          </div>
        </div>

        {/* Datos del Profesional y Botón de Salir */}
        <div className="flex items-center gap-3 text-xs">
          <div className="text-right border-r border-slate-700 pr-3 sm:pr-4">
            <p className="font-bold text-slate-200 flex items-center justify-end gap-1.5">
              <User className="w-3.5 h-3.5 text-sky-400" />
              {usuario?.nombre || usuario?.nombres ? `${usuario.nombres || usuario.nombre} ${usuario.apellidos || ''}` : 'Personal de Salud'}
            </p>
            <p className="text-slate-400 text-[11px]">
              {usuario?.establecimiento || 'DDRISS Suchitepéquez'} {usuario?.rol ? `• ${usuario.rol}` : ''}
            </p>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800/60 rounded-xl transition font-semibold cursor-pointer text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* 2. Barra de Módulos y Acordeón Superior */}
      <nav className="bg-white border-b border-slate-200 px-4 sm:px-8 py-2.5 shadow-xs sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {modulos.map((mod) => {
            const Icono = mod.icono;
            const esActivo = moduloActivo === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => setModuloActivo(mod.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition cursor-pointer ${esActivo
                  ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                  }`}
              >
                <Icono className={`w-4 h-4 ${esActivo ? 'text-white' : 'text-slate-500'}`} />
                <span>{mod.nombre}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* 3. Contenedor Principal de Vistas con Persistencia de Estado */}
      <main className="flex-1 py-4">
        <div className={moduloActivo === 'admision' ? 'block' : 'hidden'}>
          <AdmisionGestantes
            activo={moduloActivo === 'admision'}
            onSeleccionarParaARO={handleSeleccionarPacienteARO}
          />
        </div>

        <div className={moduloActivo === 'captura' ? 'block' : 'hidden'}>
          <CapturaEpidemiologica
            pacientePreseleccionado={pacienteParaARO}
            borradorQRInicial={borradorQRInicial}
            onIrABoletas={() => setModuloActivo('boletas')}
          />
        </div>

        <div className={moduloActivo === 'boletas' ? 'block' : 'hidden'}>
          <BoletasAlertas activo={moduloActivo === 'boletas'} />
        </div>

        {puedeVerDashboard && (
          <div className={moduloActivo === 'dashboard' ? 'block' : 'hidden'}>
            <DashboardGerencial activo={moduloActivo === 'dashboard'} />
          </div>
        )}

        {esAdmin && (
          <div className={moduloActivo === 'usuarios' ? 'block' : 'hidden'}>
            <GestionUsuarios activo={moduloActivo === 'usuarios'} />
          </div>
        )}
      </main>

    </div>
  );
}