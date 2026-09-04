'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Package, Truck, CheckCircle2, Clock, MapPin, Phone, Building2, AlertCircle } from 'lucide-react';

function ContenidoSeguimiento() {
  const searchParams = useSearchParams();
  const idBuscado = searchParams.get('id');

  const [pedido, setPedido] = useState<any | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    if (typeof window !== 'undefined' && idBuscado) {
      try {
        const guardados = localStorage.getItem('corralon_pedidos') || localStorage.getItem('inventario_pedidos');
        
        if (guardados) {
          const listaPedidos: any[] = JSON.parse(guardados);
          const queryLimpio = decodeURIComponent(idBuscado).trim().toLowerCase();
          
          console.log("Buscando ID/Pedido:", queryLimpio);
          console.log("Lista en localStorage:", listaPedidos);

          // Búsqueda ultra flexible
          const encontrado = listaPedidos.find(p => {
            const pId = String(p.id || '').trim().toLowerCase();
            const pNro = String(p.nroPedido || '').trim().toLowerCase();
            const pNroSinCeros = pNro.replace(/^0+/, ''); // Convierte '09' en '9'
            const querySinCeros = queryLimpio.replace(/^0+/, '');

            return (
              pId === queryLimpio ||
              pNro === queryLimpio ||
              `#${pNro}` === queryLimpio ||
              pNro === queryLimpio.replace('#', '') ||
              pNroSinCeros === querySinCeros
            );
          });

          if (encontrado) {
            setPedido(encontrado);
          }
        }
      } catch (e) {
        console.error('Error al buscar el pedido:', e);
      }
    }
  }, [idBuscado]);

  if (!montado) return null;

  if (!pedido) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold">Pedido no encontrado</h2>
          <p className="text-slate-400 text-sm">
            No pudimos encontrar el pedido <span className="text-amber-400 font-mono">#{idBuscado}</span>. Asegúrate de abrir el enlace desde el mismo navegador donde se cargó el pedido (ya que los datos se almacenan localmente en tu dispositivo).
          </p>
        </div>
      </div>
    );
  }

  const estadoActual = (pedido.estado || 'Pendiente').toLowerCase();

  const pasos = [
    { key: 'pendiente', label: 'Pedido Registrado', desc: 'Tu orden fue recibida por el corralón.' },
    { key: 'preparado', label: 'En Camino / Preparado', desc: 'Tus materiales están listos o en viaje hacia la obra.' },
    { key: 'entregado', label: 'Entregado con Éxito', desc: 'Pedido entregado correctamente.' },
  ];

  const obtenerIndicePasoActual = () => {
    if (estadoActual === 'cancelado') return -1;
    if (estadoActual === 'pendiente') return 0;
    if (estadoActual === 'preparado') return 1;
    if (estadoActual === 'entregado') return 2;
    return 0;
  };

  const indiceActual = obtenerIndicePasoActual();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">ZETA CORRALÓN</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Seguimiento Online de Envío</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase font-bold">Número de Pedido</span>
              <h2 className="text-3xl font-black font-mono text-slate-100 mt-0.5">#{pedido.nroPedido}</h2>
              <p className="text-xs text-slate-400 mt-1">Fecha de emisión: {pedido.fecha}</p>
            </div>
            <div>
              <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                estadoActual === 'entregado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                estadoActual === 'cancelado' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}>
                Estado: {pedido.estado}
              </span>
            </div>
          </div>

          {estadoActual !== 'cancelado' ? (
            <div className="space-y-6 pt-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Progreso del Envío</h3>
              <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {pasos.map((paso, idx) => {
                  const completado = idx <= indiceActual;
                  const enCurso = idx === indiceActual;
                  return (
                    <div key={paso.key} className="relative flex items-start gap-4">
                      <div className={`absolute -left-6 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        completado ? 'bg-amber-500 border-amber-500 text-slate-950' : 'bg-slate-950 border-slate-700 text-transparent'
                      }`}>
                        {completado && <span className="text-[10px] font-bold text-slate-950">✓</span>}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className={`text-sm font-bold ${enCurso ? 'text-amber-400' : completado ? 'text-slate-100' : 'text-slate-500'}`}>
                          {paso.label}
                        </h4>
                        <p className="text-xs text-slate-400">{paso.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-xl text-xs text-rose-300 space-y-1">
              <strong className="block font-bold">Este pedido fue cancelado</strong>
              <p>{pedido.observacionCancelacion || 'Sin observaciones de cancelación.'}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Destinatario</span>
              <strong className="text-slate-200 text-sm block">{pedido.nombreCliente}</strong>
              <span className="text-slate-400 block pt-1">📍 {pedido.direccionEntrega || 'Retiro en local'}</span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Logística</span>
              <div className="text-slate-200 font-semibold pt-0.5">
                Camión con Grúa: <span className={pedido.requiereGrua === 'SI' ? 'text-sky-400' : 'text-slate-400'}>{pedido.requiereGrua || 'NO'}</span>
              </div>
              <span className="text-slate-400 block pt-1">📞 {pedido.telefonoCliente || 'Sin teléfono'}</span>
            </div>
          </div>

          {pedido.observaciones && (
            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3.5 rounded-xl text-xs space-y-1">
              <strong className="block font-bold">Observaciones del Pedido:</strong>
              <p>{pedido.observaciones}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Artículos del Pedido</h3>
            <div className="space-y-2">
              {(pedido.items || []).map((item: any, index: number) => (
                <div key={index} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-100">{item.cantidad}x {item.nombre}</span>
                    {item.acopio?.esAcopio && (
                      <span className="text-[10px] text-purple-400 block font-semibold">
                        📦 Acopio (Pendiente: {item.acopio.cantidadPendienteRetiro})
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${((item.precioUnitario || 0) * item.cantidad).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-slate-800 font-bold text-sm">
              <span className="text-slate-400">Total General:</span>
              <span className="text-emerald-400 text-base font-mono">${(pedido.total || 0).toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-600">
          <p>© 2026 Zeta Corralón. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
}

export default function SeguimientoPedidoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">Cargando seguimiento...</div>}>
      <ContenidoSeguimiento />
    </Suspense>
  );
}