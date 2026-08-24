'use client';

import { useState } from 'react';
import { useInventario } from '@/context/InventarioContext';
import { Users, UserPlus, Trash2, CheckCircle2 } from 'lucide-react';

export default function UsuariosPage() {
  const { usuarios, agregarUsuario, eliminarUsuario } = useInventario();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState<'operador' | 'ejecutivo'>('operador');
  const [mensajeExito, setMensajeExito] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !email.trim()) return;

    agregarUsuario({
      nombre,
      apellido,
      email,
      rol
    });

    setNombre('');
    setApellido('');
    setEmail('');
    setRol('operador');
    setMensajeExito('¡Usuario creado correctamente!');
    setTimeout(() => setMensajeExito(''), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-500" />
            Gestión de Usuarios y Roles
          </h1>
          <p className="text-slate-400 mt-1">
            Administra el personal del corralón y asigna perfiles de Operador o Ejecutivo.
          </p>
        </div>
      </div>

      {mensajeExito && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          {mensajeExito}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Alta */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-amber-500" />
            Registrar Nuevo Usuario
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Nombre</label>
              <input
                type="text"
                required
                placeholder="Ej. Juan"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Apellido</label>
              <input
                type="text"
                required
                placeholder="Ej. Pérez"
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Correo Electrónico</label>
              <input
                type="email"
                required
                placeholder="usuario@corralon.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Asignar Perfil / Rol</label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value as 'operador' | 'ejecutivo')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-amber-400 font-semibold focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="operador">Operador (Caja y Ventas del día)</option>
                <option value="ejecutivo">Ejecutivo (Acceso Total y Panel de Control)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-colors cursor-pointer text-sm shadow-lg shadow-amber-500/10"
            >
              Guardar Usuario
            </button>
          </form>
        </div>

        {/* Tabla de Usuarios Registrados */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-bold text-slate-100">Personal Registrado en el Sistema</h2>
            <p className="text-xs text-slate-400 mt-0.5">Listado de cuentas autorizadas y sus niveles de acceso.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Correo</th>
                  <th className="px-6 py-4 text-center">Perfil Asignado</th>
                  <th className="px-6 py-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {usuarios.length > 0 ? (
                  usuarios.map((usr) => (
                    <tr key={usr.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-100">
                        {usr.nombre} {usr.apellido}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                        {usr.email}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          usr.rol === 'ejecutivo'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                        }`}>
                          {usr.rol}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => eliminarUsuario(usr.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      No hay usuarios registrados todavía.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}