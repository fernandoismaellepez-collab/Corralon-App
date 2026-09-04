'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  Building2, 
  AlertCircle,
  Navigation
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function SeguimientoPedidoPage() {
  const params = useParams();
  const idPedido = params?.id as string;

  const [pedido, setPedido] = useState<any | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
    if (typeof window !== 'undefined' && idPedido) {
      try {
        const guardados = localStorage.getItem('corralon_pedidos') || localStorage.getItem('inventario_pedidos');
        
        if (guardados) {
          const listaPedidos: any[] = JSON.parse(guardados);
          const idBuscado = decodeURIComponent(idPedido).trim().toLowerCase();
          
          const encontrado = listaPedidos.find(p => {
            const pId = (p.id || '').toLowerCase();
            const pNro = (p.nroPedido || '').toLowerCase();
            const pNroConHash = `#${pNro}`;
            return pId === idBuscado || pNro === idBuscado || pNroConHash === idBuscado || pNro === idBuscado.replace('#', '');
          });

          if (encontrado) {
            setPedido(encontrado);
          }
        }
      } catch (e) {
        console.error('Error al buscar el pedido para seguimiento:', e);
      }
    }
  }, [idPedido]);

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
            Lo sentimos, el enlace de seguimiento no es válido o el pedido ya no se encuentra disponible en el sistema.
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
  const defaultPosition: [number, number] = [-34.4588, -58.9143];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl mb-1">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">ZETA CORRALÓN</h1>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Seguimiento Online de Envío</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <span className="text-xs font-mono text-amber-400 uppercase font-bold">Número de Pedido</span>
              <h2 className="text-3xl font-black font-mono text-slate-100 mt-0.5">{pedido.nroPedido}</h2>
              <p className="text-xs text-slate-400 mt-1">Fecha de emisión: {pedido.fecha}</p>
              {pedido.fechaEntregaPactada && (
                <p className="text-xs text-purple-300 mt-1 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 inline-block">
                  📅 Reprogramación / Acopio pactado: <strong>{pedido.fechaEntregaPactada}</strong>
                </p>
              )}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
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
                        {completado && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
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

          {(estadoActual === 'en camino' || estadoActual === 'preparado' || estadoActual === 'pendiente') && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation className="w-4 h-4 text-amber-500 animate-pulse" /> 
                  Ubicación del Envío / Depósito
                </h3>
                <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                  En tiempo real
                </span>
              </div>
              <div className="w-full h-64 rounded-xl overflow-hidden border border-slate-800 relative z-0">
                <MapContainer 
                  center={defaultPosition} 
                  zoom={13} 
                  scrollWheelZoom={false}
                  style={{ height: '100%', width: '100%', backgroundColor: '#020617' }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <Marker position={defaultPosition} icon={customIcon}>
                    <Popup>
                      <div className="text-slate-900 text-xs font-sans">
                        <strong>Destino:</strong> {pedido.direccionEntrega}<br/>
                        <strong>Cliente:</strong> {pedido.nombreCliente}
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-xs">
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Destinatario</span>
              <strong className="text-slate-200 text-sm block">{pedido.nombreCliente}</strong>
              <span className="text-slate-400 flex items-center gap-1 pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {pedido.direccionEntrega}
              </span>
            </div>
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-slate-500 block uppercase font-bold text-[10px]">Logística</span>
              <div className="text-slate-200 font-semibold pt-0.5">
                Camión con Grúa: <span className={pedido.requiereGrua === 'SI' ? 'text-sky-400' : 'text-slate-400'}>{pedido.requiereGrua}</span>
              </div>
              <span className="text-slate-400 flex items-center gap-1 pt-1">
                <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {pedido.telefonoCliente || 'Sin teléfono'}
              </span>
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
                    <span className="text-[10px] text-slate-500 font-mono block">Cód: {item.codigo}</span>
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