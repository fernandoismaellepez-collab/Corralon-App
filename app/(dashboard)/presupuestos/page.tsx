'use client';

import { useState } from 'react';
import { FileText, Plus, Trash2, Printer, Send } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';

export default function PresupuestosPage() {
  const { productos } = useInventario();
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [itemsPresupuesto, setItemsPresupuesto] = useState<{ productoId: string; nombre: string; precio: number; cantidad: number }[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const agregarItem = () => {
    const prod = productos.find(p => p.id === productoSeleccionado);
    if (!prod) return;

    setItemsPresupuesto(prev => [
      ...prev,
      { productoId: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: Number(cantidad) || 1 }
    ]);
    setProductoSeleccionado('');
    setCantidad(1);
  };

  const eliminarItem = (index: number) => {
    setItemsPresupuesto(prev => prev.filter((_, i) => i !== index));
  };

  const totalPresupuesto = itemsPresupuesto.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);

  const enviarWhatsAppPresupuesto = () => {
    if (!telefonoCliente || itemsPresupuesto.length === 0) {
      alert('Ingresa el teléfono del cliente y al menos un producto.');
      return;
    }
    let mensaje = `*PRESUPUESTO - CORRALÓN*\nCliente: ${nombreCliente || 'Consumidor Final'}\n\n*Detalle:*\n`;
    itemsPresupuesto.forEach(i => {
      mensaje += `- ${i.cantidad}x ${i.nombre} ($${(i.precio * i.cantidad).toLocaleString('es-AR')})\n`;
    });
    mensaje += `\n*TOTAL ESTIMADO: $${totalPresupuesto.toLocaleString('es-AR')}*\n\n_Presupuesto válido por 7 días._`;

    const url = `https://api.whatsapp.com/send?phone=${telefonoCliente}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-500" /> Presupuestos Rápidos
          </h1>
          <p className="text-slate-400 text-sm">Genera cotizaciones para clientes sin descontar stock ni registrar pedidos formales.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO DE CLIENTE Y PRODUCTOS */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Datos del Cliente</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre del Cliente</label>
            <input type="text" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white" placeholder="Ej. Juan Pérez" />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Teléfono (WhatsApp)</label>
            <input type="text" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white" placeholder="Ej. 54911..." />
          </div>

          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 pt-4">Agregar Productos</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Seleccionar Producto</label>
            <select value={productoSeleccionado} onChange={e => setProductoSeleccionado(e.target.value)} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white">
              <option value="">-- Seleccionar --</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} (${p.precio})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Cantidad</label>
            <input type="number" min="1" value={cantidad} onChange={e => setCantidad(Number(e.target.value))} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white" />
          </div>
          <button onClick={agregarItem} className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" /> Agregar al Presupuesto
          </button>
        </div>

        {/* VISTA PREVIA DEL PRESUPUESTO */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Cotización / Presupuesto</h3>
                <p className="text-xs text-slate-400">Cliente: {nombreCliente || 'Consumidor Final'}</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Estimado</span>
                <span className="text-2xl font-black text-amber-400">${totalPresupuesto.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio Unit.</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {itemsPresupuesto.length > 0 ? (
                    itemsPresupuesto.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-white">{item.nombre}</td>
                        <td className="px-4 py-3 text-center">{item.cantidad}</td>
                        <td className="px-4 py-3 text-right">${item.precio.toLocaleString('es-AR')}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">${(item.precio * item.cantidad).toLocaleString('es-AR')}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => eliminarItem(index)} className="text-slate-400 hover:text-rose-400 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                        No hay productos agregados al presupuesto actual.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
            <button onClick={() => window.print()} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
            <button onClick={enviarWhatsAppPresupuesto} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer">
              <Send className="w-4 h-4" /> Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}