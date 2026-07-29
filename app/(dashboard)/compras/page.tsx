'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, FileText, CheckCircle, Clock, X, Trash2, Building2 } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';

interface ItemOrdenCompra {
  productoId: string;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioEstimado: number;
}

interface OrdenCompra {
  id: string;
  nroOrden: string;
  proveedorNombre: string;
  fecha: string;
  items: ItemOrdenCompra[];
  totalEstimado: number;
  estado: 'Pendiente' | 'Recibida';
}

export default function ComprasYSolpesPage() {
  const [montado, setMontado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const { productos, proveedores } = useInventario() as { productos: any[]; proveedores: any[] };

  // Estados para la nueva orden de compra
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [productoIdTemp, setProductoIdTemp] = useState('');
  const [cantidadTemp, setCantidadTemp] = useState(1);
  const [itemsOrden, setItemsOrden] = useState<ItemOrdenCompra[]>([]);
  
  // Lista de órdenes de compra guardadas en localStorage para persistencia visual
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([]);

  useEffect(() => {
    setMontado(true);
    const guardadas = localStorage.getItem('corralon_ordenes_compra');
    if (guardadas) {
      try {
        setOrdenes(JSON.parse(guardadas));
      } catch (e) {
        console.error("Error al cargar órdenes de compra", e);
      }
    }
  }, []);

  const agregarItemAOrden = () => {
    if (!productoIdTemp) return;
    const prod = productos.find(p => p.id === productoIdTemp);
    if (!prod) return;
    const cant = Number(cantidadTemp) || 1;

    const existeIndex = itemsOrden.findIndex(i => i.productoId === prod.id);
    if (existeIndex >= 0) {
      const nuevos = [...itemsOrden];
      nuevos[existeIndex].cantidad += cant;
      setItemsOrden(nuevos);
    } else {
      setItemsOrden([
        ...itemsOrden,
        {
          productoId: prod.id,
          codigo: prod.codigo,
          nombre: prod.nombre,
          cantidad: cant,
          precioEstimado: prod.precio // Tomamos como referencia el precio de venta o base
        }
      ]);
    }
    setProductoIdTemp('');
    setCantidadTemp(1);
  };

  const quitarItemOrden = (index: number) => {
    setItemsOrden(itemsOrden.filter((_, i) => i !== index));
  };

  const guardarOrdenCompra = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorSeleccionado || itemsOrden.length === 0) return;

    const totalEstimado = itemsOrden.reduce((acc, item) => acc + (item.precioEstimado * item.cantidad), 0);
    const nuevaOrden: OrdenCompra = {
      id: `OC-${Date.now()}`,
      nroOrden: `#OC-${Math.floor(1000 + Math.random() * 9000)}`,
      proveedorNombre: proveedorSeleccionado,
      fecha: new Date().toISOString().split('T')[0],
      items: itemsOrden,
      totalEstimado,
      estado: 'Pendiente'
    };

    const nuevasOrdenes = [nuevaOrden, ...ordenes];
    setOrdenes(nuevasOrdenes);
    localStorage.setItem('corralon_ordenes_compra', JSON.stringify(nuevasOrdenes));

    // Resetear y cerrar modal
    setModalAbierto(false);
    setProveedorSeleccionado('');
    setItemsOrden([]);
  };

  const marcarComoRecibida = (id: string) => {
    const actualizadas = ordenes.map(o => o.id === id ? { ...o, estado: 'Recibida' as const } : o);
    setOrdenes(actualizadas);
    localStorage.setItem('corralon_ordenes_compra', JSON.stringify(actualizadas));
  };

  const pendientesCount = ordenes.filter(o => o.estado === 'Pendiente').length;
  const recibidasCount = ordenes.filter(o => o.estado === 'Recibida').length;

  if (!montado) return null;

  return (
    <div className="p-8 w-full space-y-6 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-8 h-8 text-amber-500" />
            Compras y Solicitudes de Pedido (SOLPES)
          </h1>
          <p className="text-slate-400 mt-1">
            Gestión de abastecimiento a proveedores y reposición de stock del corralón.
          </p>
        </div>
        <button 
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-5 h-5" />
          Nueva Orden de Compra
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">SOLPES / Órdenes Pendientes</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white">{pendientesCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Total Órdenes Registradas</span>
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">{ordenes.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Recibidas / Completadas</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{recibidasCount}</div>
        </div>
      </div>

      {ordenes.length > 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4">Nro / Fecha</th>
                  <th className="px-5 py-4">Proveedor</th>
                  <th className="px-5 py-4">Materiales Solicitados</th>
                  <th className="px-5 py-4 text-right">Total Est. ($)</th>
                  <th className="px-5 py-4 text-center">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {ordenes.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs">
                      <span className="font-bold text-amber-500 text-sm">{ord.nroOrden}</span>
                      <div className="text-slate-500 mt-0.5">{ord.fecha}</div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-100 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-500" />
                      {ord.proveedorNombre}
                    </td>
                    <td className="px-5 py-4">
                      <div className="space-y-1 max-w-sm">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="text-xs bg-slate-950 px-2.5 py-1 rounded border border-slate-800 flex justify-between">
                            <span>{it.cantidad}x {it.nombre}</span>
                            <span className="text-slate-400 font-mono">${(it.precioEstimado * it.cantidad).toLocaleString('es-AR')}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-400">
                      ${ord.totalEstimado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        ord.estado === 'Pendiente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {ord.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {ord.estado === 'Pendiente' && (
                        <button
                          onClick={() => marcarComoRecibida(ord.id)}
                          className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ml-auto"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Marcar Recibida
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-12 text-center text-slate-400 space-y-3">
          <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No hay órdenes de compra registradas</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Desde este módulo podrás generar y realizar el seguimiento de tus pedidos a corralones y fábricas mayoristas.
          </p>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-amber-500" />
                Generar Orden de Compra
              </h3>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={guardarOrdenCompra} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Proveedor / Mayorista</label>
                <select
                  required
                  value={proveedorSeleccionado}
                  onChange={(e) => setProveedorSeleccionado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Seleccionar Proveedor --</option>
                  {proveedores && proveedores.length > 0 ? (
                    proveedores.map((prov: any) => (
                      <option key={prov.id || prov.nombre} value={prov.nombre}>
                        {prov.nombre} {prov.rubro ? `(${prov.rubro})` : ''}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Holcim Argentina">Holcim Argentina (Cementos)</option>
                      <option value="Loma Negra">Loma Negra (Cementos y Cal)</option>
                      <option value="Acindar">Acindar (Hierros y Aceros)</option>
                      <option value="Cerámica Quilmes">Cerámica Quilmes (Ladrillos)</option>
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Agregar Materiales a la Orden</label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select
                      value={productoIdTemp}
                      onChange={(e) => setProductoIdTemp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Seleccionar producto del inventario --</option>
                      {productos.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} - {p.nombre} (Stock actual: {p.stockActual})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      value={cantidadTemp}
                      onChange={(e) => setCantidadTemp(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 text-center focus:outline-none focus:border-amber-500"
                      placeholder="Cant"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarItemAOrden}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Añadir
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto mt-2">
                  {itemsOrden.length > 0 ? (
                    itemsOrden.map((item, index) => (
                      <div key={index} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-100 text-xs">{item.cantidad}x {item.nombre}</span>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Est. Unitario: ${item.precioEstimado.toLocaleString('es-AR')} | Subtotal: <strong className="text-emerald-400">${(item.precioEstimado * item.cantidad).toLocaleString('es-AR')}</strong>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => quitarItemOrden(index)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      Ningún material agregado a la orden todavía.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={itemsOrden.length === 0 || !proveedorSeleccionado}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Generar Orden
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}