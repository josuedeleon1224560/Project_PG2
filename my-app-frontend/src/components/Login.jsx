import { useState } from 'react';
import { Lock, Mail, ShieldCheck, Building2, RefreshCw, AlertCircle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('Ingrese su correo institucional y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.user));
        if (onLoginSuccess) {
          onLoginSuccess(data.user, data.token);
        }
      } else {
        setErrorMsg(data.message || 'Credenciales de acceso no válidas.');
      }
    } catch (err) {
      console.error('Error de conexión en autenticación:', err);
      setErrorMsg('No se pudo conectar con el servidor de autenticación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-8 space-y-6">
        
        {/* Encabezado Institucional */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-sky-600 text-white font-black text-2xl shadow-md mb-1">
            G
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Sistema SIREP - MSPAS
          </h1>
          <p className="text-xs font-semibold text-sky-700 flex items-center justify-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> DDRISS Suchitepéquez
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Vigilancia Epidemiológica de Alto Riesgo Obstétrico (ARO)
          </p>
        </div>

        {/* Alerta de Error */}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Acceso */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Correo Electrónico Institucional
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@mspas.gob.gt"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              Contraseña de Acceso
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-3 bg-sky-600 hover:bg-sky-700 active:scale-[0.99] text-white font-extrabold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {cargando ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Verificando Credenciales...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" /> Iniciar Sesión
              </>
            )}
          </button>
        </form>

        {/* Pie de seguridad */}
        <div className="border-t pt-4 text-center">
          <p className="text-[11px] text-slate-400 font-medium">
            Acceso restringido a personal de salud autorizado por la DDRISS Suchitepéquez.
          </p>
        </div>

      </div>
    </div>
  );
}
