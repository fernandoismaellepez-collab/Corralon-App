'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Search, Lock, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ConsultaMovilPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const PIN_CORRECTO = '1234'; // PIN de los repartidores

  const verificarPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === PIN_CORRECTO) {
      setAutenticado(true);
    } else {
      alert('PIN incorrecto. Inténtalo de nuevo.');
      setPin('');
    }
  };

  const buscarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim()) return;

    setCargando(true);
    setBuscado(true);
    try {
      const res = await fetch(`/api/whatsapp-precio?q=${encodeURIComponent(busqueda)}`);
      const data = await res.json();
      
      if (data.productos) {
        setResultados(data.productos);
      } else {
        setResultados([]);
      }
    } catch (err) {
      console.error('Error al buscar:', err);
      setResultados([]);
    } finally {
      setCargando(false);
    }
  };

  // Contenedor principal con position fixed y z-index alto para aislarlo de cualquier layout anterior
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto flex flex-col justify-between p-4 sm:p-6">
      
      {!autenticado ? (
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Acceso Repartidores</h1>
              <p className="text-xs text-slate-400">Ingresa el PIN de seguridad de 4 dígitos provisto por el corralón.</p>
            </div>

            <form onSubmit={verificarPin} className="space-y-4">
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-center text-2xl font-mono tracking-widest text-amber-400 focus:outline-none focus:border-amber-500"
                required
                autoFocus
              />
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-4 rounded-2xl transition-all shadow-lg cursor-pointer"
              >
                Ingresar al Sistema
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="max-w-md mx-auto w-full space-y-6 py-2 flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-500 uppercase block tracking-wider">Corralón Móvil</span>
                  <h2 className="text-sm font-bold text-white">Consulta en Calle</h2>
                </div>
              </div>
              <button
                onClick={() => setAutenticado(false)}
                className="text-[11px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl"
              >
                Bloquear
              </button>
            </div>

            <form onSubmit={buscarProducto} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="¿Qué producto buscas? (ej. cemento)"
                  className="w-full bg-slate-900 border border-slate-700 rounded-2xl pl-12 pr-4 py-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 shadow-inner"
                  autoFocus
                />
                <Search className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-4 rounded-2xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {cargando ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Consultar Precio y Stock
              </button>
            </form>

            <div className="space-y-3 pt-2">
              {cargando ? (
                <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                  Buscando en la base de datos...
                </div>
              ) : buscado && resultados.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs space-y-1">
                  <p className="font-bold text-white">Sin resultados</p>
                  <p>No se encontró ningún producto con ese nombre.</p>
                </div>
              ) : (
                resultados.map((item, idx) => {
                  const precio = Number(item.precio || item.precio_venta || 0).toLocaleString('es-AR');
                  const stock = item.stock || item.cantidad || 0;
                  return (
                    <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
                      <div className="flex items-start justify-between">
                        <span className="text-sm font-bold text-white">{item.nombre}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${stock > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                          Stock: {stock} disp.
                        </span>
                      </div>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between">
                        <span className="text-xs text-slate-400 uppercase font-mono">Precio de Venta:</span>
                        <span className="text-base font-mono font-extrabold text-amber-400">${precio}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-center pt-6 pb-2 text-[10px] text-slate-600 font-mono">
            Sistema Interno Corralón • Acceso Restringido
          </div>
        </div>
      )}

    </div>
  );
}