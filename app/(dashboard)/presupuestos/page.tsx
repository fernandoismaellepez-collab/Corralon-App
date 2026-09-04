'use client';

import { useState } from 'react';
import { FileText, Plus, Trash2, Printer, Send } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';

export default function PresupuestosPage() {
  const { productos } = useInventario();
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [itemsPresupuesto, setItemsPresupuesto] = useState<{ productoId: string; nombre: string; precio: number; precioPromocion: number; cantidad: number }[]>([]);
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidad, setCantidad] = useState(1);

  const agregarItem = () => {
    if (!productoSeleccionado) return;
    const prod = productos.find((p: any) => p.id === productoSeleccionado);
    if (!prod) return;

    const cant = Number(cantidad) || 1;
    const existeIndex = itemsPresupuesto.findIndex(i => i.productoId === prod.id);

    if (existeIndex >= 0) {
      const nuevos = [...itemsPresupuesto];
      nuevos[existeIndex].cantidad += cant;
      setItemsPresupuesto(nuevos);
    } else {
      setItemsPresupuesto(prev => [
        ...prev,
        { 
          productoId: prod.id, 
          nombre: prod.nombre, 
          precio: prod.precio, 
          precioPromocion: prod.precio, // Por defecto arranca igual al precio de lista
          cantidad: cant 
        }
      ]);
    }
    setProductoSeleccionado('');
    setCantidad(1);
  };

  const eliminarItem = (index: number) => {
    setItemsPresupuesto(prev => prev.filter((_, i) => i !== index));
  };

  const cambiarPrecioPromocion = (index: number, valor: string) => {
    const nuevos = [...itemsPresupuesto];
    const num = parseFloat(valor.replace(',', '.')) || 0;
    nuevos[index].precioPromocion = num;
    setItemsPresupuesto(nuevos);
  };

  const totalPresupuestoLista = itemsPresupuesto.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const totalPresupuestoPromocion = itemsPresupuesto.reduce((acc, item) => acc + (item.precioPromocion * item.cantidad), 0);

  const enviarWhatsAppPresupuesto = () => {
    if (!telefonoCliente || itemsPresupuesto.length === 0) {
      alert('Por favor, ingresa el teléfono del cliente y al menos un producto para enviar el presupuesto.');
      return;
    }

    let telefonoLimpio = telefonoCliente.replace(/\D/g, '');
    if (telefonoLimpio && !telefonoLimpio.startsWith('54')) {
      telefonoLimpio = `549${telefonoLimpio}`;
    }

    let mensaje = `*PRESUPUESTO - CORRALÓN*\nCliente: ${nombreCliente || 'Consumidor Final'}\n\n*Detalle de materiales:*\n`;
    itemsPresupuesto.forEach(i => {
      mensaje += `- ${i.cantidad}x ${i.nombre} (Lista: $${(i.precio * i.cantidad).toLocaleString('es-AR')} | Promo Z: $${(i.precioPromocion * i.cantidad).toLocaleString('es-AR')})\n`;
    });
    mensaje += `\n*TOTAL LISTA: $${totalPresupuestoLista.toLocaleString('es-AR')}*\n`;
    mensaje += `*TOTAL BENEFICIO Z (PROMO): $${totalPresupuestoPromocion.toLocaleString('es-AR')}*\n\n_Presupuesto de carácter informativo, válido por 7 días. No reserva stock._`;

    const url = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <FileText className="w-8 h-8 text-amber-500" /> Presupuestos Rápidos
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Herramienta informativa para cotizar a clientes sin descontar stock ni generar registros en el sistema.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO DE CLIENTE Y PRODUCTOS */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Datos del Cliente</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nombre del Cliente</label>
            <input 
              type="text" 
              value={nombreCliente} 
              onChange={e => setNombreCliente(e.target.value)} 
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500" 
              placeholder="Ej. Juan Pérez" 
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Teléfono (WhatsApp)</label>
            <input 
              type="text" 
              value={telefonoCliente} 
              onChange={e => setTelefonoCliente(e.target.value)} 
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500" 
              placeholder="Ej. 11 2345-6789" 
            />
          </div>

          <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 pt-4">Agregar Productos</h2>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Seleccionar Producto</label>
            <select 
              value={productoSeleccionado} 
              onChange={e => setProductoSeleccionado(e.target.value)} 
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Seleccionar producto --</option>
              {productos.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (${p.precio.toLocaleString('es-AR')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Cantidad</label>
            <input 
              type="number" 
              min="1" 
              value={cantidad} 
              onChange={e => setCantidad(Number(e.target.value))} 
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500" 
            />
          </div>
          <button 
            onClick={agregarItem} 
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar al Presupuesto
          </button>
        </div>

        {/* VISTA PREVIA DEL PRESUPUESTO */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-4 mb-4 gap-4">
              <div>
                <h3 className="text-xl font-bold text-white">Vista Previa de Cotización</h3>
                <p className="text-xs text-slate-400 mt-0.5">Cliente: <strong className="text-slate-200">{nombreCliente || 'Consumidor Final'}</strong></p>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Precio Lista</span>
                  <span className="text-lg font-bold text-slate-300">${totalPresupuestoLista.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="text-right border-l border-slate-800 pl-4">
                  <span className="text-[11px] text-amber-400 block font-semibold">Total Beneficio Z</span>
                  <span className="text-xl font-black text-amber-400">${totalPresupuestoPromocion.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3 text-center">Cant.</th>
                    <th className="px-4 py-3 text-right">Precio Lista</th>
                    <th className="px-4 py-3 text-right">Precio Promo Z</th>
                    <th className="px-4 py-3 text-right">Subtotal Promo Z</th>
                    <th className="px-4 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {itemsPresupuesto.length > 0 ? (
                    itemsPresupuesto.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-medium text-white">{item.nombre}</td>
                        <td className="px-4 py-3 text-center">{item.cantidad}</td>
                        <td className="px-4 py-3 text-right text-slate-400 font-mono">${item.precio.toLocaleString('es-AR')}</td>
                        <td className="px-4 py-3 text-right">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={item.precioPromocion}
                            onChange={(e) => cambiarPrecioPromocion(index, e.target.value)}
                            className="w-24 bg-slate-950 border border-amber-500/40 focus:border-amber-500 text-amber-300 font-bold text-right rounded px-2 py-1 text-xs focus:outline-none font-mono"
                          />
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400 font-mono">${(item.precioPromocion * item.cantidad).toLocaleString('es-AR')}</td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={() => eliminarItem(index)} className="text-slate-400 hover:text-rose-400 cursor-pointer p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-16 text-center text-slate-500">
                        No hay productos agregados en este presupuesto. (Módulo meramente informativo).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-slate-800 mt-6">
            <button 
              onClick={() => window.print()} 
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button 
              onClick={enviarWhatsAppPresupuesto} 
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Send className="w-4 h-4" /> Enviar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}