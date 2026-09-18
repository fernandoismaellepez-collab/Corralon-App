'use client';
export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { Search, Lock, ShieldCheck, RefreshCw, ShoppingCart, Trash2, Plus, Minus, Send, Calculator } from 'lucide-react';

export default function ConsultaMovilPage() {
  const [autenticado, setAutenticado] = useState(false);
  const [pin, setPin] = useState('');
  
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  // Estados para el Presupuesto / Carrito
  const [presupuesto, setPresupuesto] = useState<any[]>([]);
  const [costoFlete, setCostoFlete] = useState<number>(0);
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [vistaActual, setVistaActual] = useState<'consulta' | 'presupuesto'>('consulta');

  const PIN_CORRECTO = '1234'; // PIN de seguridad

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

  // Funciones del Presupuesto
  const agregarAlPresupuesto = (item: any) => {
    const precioUnitario = Number(item.precio || item.precio_venta || 0);
    const existe = presupuesto.find((p) => p.nombre === item.nombre);

    if (existe) {
      setPresupuesto(
        presupuesto.map((p) =>
          p.nombre === item.nombre ? { ...p, cantidad: p.cantidad + 1 } : p
        )
      );
    } else {
      setPresupuesto([
        ...presupuesto,
        {
          nombre: item.nombre,
          precio: precioUnitario,
          cantidad: 1,
          stock: item.stock || item.cantidad || 0
        }
      ]);
    }
    alert(`¡${item.nombre} agregado al presupuesto!`);
  };

  const actualizarCantidad = (nombre: string, delta: number) => {
    setPresupuesto(
      presupuesto
        .map((p) => {
          if (p.nombre === nombre) {
            const nuevaCantidad = p.cantidad + delta;
            return nuevaCantidad > 0 ? { ...p, cantidad: nuevaCantidad } : null;
          }
          return p;
        })
        .filter(Boolean)
    );
  };

  const eliminarItemPresupuesto = (nombre: string) => {
    setPresupuesto(presupuesto.filter((p) => p.nombre !== nombre));
  };

  const subtotalPresupuesto = presupuesto.reduce((acc, p) => acc + p.precio * p.cantidad, 0);
  const totalGeneral = subtotalPresupuesto + Number(costoFlete || 0);

  const enviarPorWhatsApp = () => {
    if (presupuesto.length === 0) {
      alert('El presupuesto está vacío.');
      return;
    }

    let mensaje = `*COTIZACIÓN / PRESUPUESTO - CORRALÓN*\n`;
    if (nombreCliente) mensaje += `Cliente: ${nombreCliente}\n`;
    mensaje += `------------------------------------\n`;

    presupuesto.forEach((p, idx) => {
      const sub = p.precio * p.cantidad;
      mensaje += `${idx + 1}. *${p.nombre}*\n   ${p.cantidad} un. x $${p.precio.toLocaleString('es-AR')} = *$${sub.toLocaleString('es-AR')}*\n`;
    });

    mensaje += `------------------------------------\n`;
    if (costoFlete > 0) {
      mensaje += `Flete / Envío: *$${Number(costoFlete).toLocaleString('es-AR')}*\n`;
    }
    mensaje += `*TOTAL GENERAL: $${totalGeneral.toLocaleString('es-AR')}*\n\n`;
    mensaje += `_Precios sujetos a disponibilidad y variación de mercado. Validez: 24 hs._`;

    const telefonoLimpio = telefonoCliente.replace(/\D/g, '');
    const url = telefonoLimpio
      ? `https://wa.me/549${telefonoLimpio}?text=${encodeURIComponent(mensaje)}`
      : `https://wa.me/?text=${encodeURIComponent(mensaje)}`;

    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 overflow-y-auto flex flex-col justify-between p-4 sm:p-6">
      
      {!autenticado ? (
        <div className="min-h-full flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-sm shadow-2xl space-y-6 text-center">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold text-white">Acceso Repartidores / Ventas</h1>
              <p className="text-xs text-slate-400">Ingresa el PIN de seguridad de 4 dígitos para consultar precios y armar presupuestos.</p>
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
            
            {/* Header & Navegación de Vistas */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-500 uppercase block tracking-wider">Corralón Móvil</span>
                  <h2 className="text-sm font-bold text-white">Presupuesto Express</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAutenticado(false)}
                  className="text-[11px] text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl"
                >
                  Bloquear
                </button>
              </div>
            </div>

            {/* Pestañas de Navegación */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setVistaActual('consulta')}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${vistaActual === 'consulta' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <Search className="w-3.5 h-3.5" /> Buscar Precios
              </button>
              <button
                onClick={() => setVistaActual('presupuesto')}
                className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 relative ${vistaActual === 'presupuesto' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                <ShoppingCart className="w-3.5 h-3.5" /> Ver Presupuesto
                {presupuesto.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
                    {presupuesto.reduce((a, b) => a + b.cantidad, 0)}
                  </span>
                )}
              </button>
            </div>

            {/* VISTA 1: BUSCADOR DE PRODUCTOS */}
            {vistaActual === 'consulta' ? (
              <div className="space-y-4">
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
                    Consultar en Base de Datos
                  </button>
                </form>

                <div className="space-y-3 pt-2">
                  {cargando ? (
                    <div className="text-center py-12 text-slate-500 text-xs flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
                      Buscando producto...
                    </div>
                  ) : buscado && resultados.length === 0 ? (
                    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl text-center text-slate-400 text-xs space-y-1">
                      <p className="font-bold text-white">Sin resultados</p>
                      <p>No se encontró ningún producto con ese nombre.</p>
                    </div>
                  ) : (
                    resultados.map((item, idx) => {
                      const precio = Number(item.precio || item.precio_venta || 0);
                      const stock = item.stock || item.cantidad || 0;
                      return (
                        <div key={idx} className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3 shadow-lg">
                          <div className="flex items-start justify-between">
                            <span className="text-sm font-bold text-white">{item.nombre}</span>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${stock > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                              Stock: {stock} disp.
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-mono block">Precio Venta</span>
                              <span className="text-base font-mono font-extrabold text-amber-400">${precio.toLocaleString('es-AR')}</span>
                            </div>
                            <button
                              onClick={() => agregarAlPresupuesto(item)}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Plus className="w-4 h-4" /> Agregar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              /* VISTA 2: CARRITO / PRESUPUESTO ARMADO */
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" /> Datos del Cliente (Opcional)
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Nombre del Cliente"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="tel"
                      placeholder="WhatsApp (ej. 1123456789)"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {presupuesto.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      No hay productos agregados al presupuesto.
                    </div>
                  ) : (
                    presupuesto.map((p, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-white block">{p.nombre}</span>
                          <span className="text-slate-400 font-mono">${p.precio.toLocaleString('es-AR')} c/u</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                            <button onClick={() => actualizarCantidad(p.nombre, -1)} className="text-slate-400 hover:text-white">
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="font-mono font-bold w-5 text-center text-amber-400">{p.cantidad}</span>
                            <button onClick={() => actualizarCantidad(p.nombre, 1)} className="text-slate-400 hover:text-white">
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <span className="font-mono font-bold text-emerald-400 w-16 text-right">
                            ${(p.precio * p.cantidad).toLocaleString('es-AR')}
                          </span>

                          <button onClick={() => eliminarItemPresupuesto(p.nombre)} className="text-rose-400 hover:text-rose-300">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Subtotales y Flete */}
                {presupuesto.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Subtotal Materiales:</span>
                      <span className="font-mono font-bold">${subtotalPresupuesto.toLocaleString('es-AR')}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Costo de Flete / Envío ($):</span>
                      <input
                        type="number"
                        value={costoFlete || ''}
                        onChange={(e) => setCostoFlete(Number(e.target.value))}
                        placeholder="0"
                        className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-right text-xs text-amber-400 font-mono"
                      />
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-sm">
                      <span className="font-bold text-white">Total General:</span>
                      <span className="font-mono font-extrabold text-amber-400 text-base">${totalGeneral.toLocaleString('es-AR')}</span>
                    </div>

                    <button
                      onClick={enviarPorWhatsApp}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Enviar Presupuesto por WhatsApp
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="text-center pt-4 pb-2 text-[10px] text-slate-600 font-mono">
            Sistema Interno Corralón • Acceso Restringido
          </div>
        </div>
      )}

    </div>
  );
}