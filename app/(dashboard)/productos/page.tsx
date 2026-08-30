'use client';

import { useState } from 'react';
import { Package, Plus, Search, Filter, Edit, X, Trash2 } from 'lucide-react';
import { useInventario, Producto } from '@/context/InventarioContext';
import ImportadorExcel from '@/components/ImportadorExcel';

const categorias = ['Todas', 'Áridos', 'Cementos y Cal', 'Ladrillos y Bloques', 'Hierros y Mallas', 'Perfiles y Chapas', 'Plomería y Agua', 'Ferretería y Herramientas', 'Pinturas y Impermeabilizantes'];

const prefijosPorCategoria: Record<string, string> = {
  'Áridos': 'ARI', 'Cementos y Cal': 'CEM', 'Ladrillos y Bloques': 'LAD', 'Hierros y Mallas': 'HIE',
  'Perfiles y Chapas': 'PER', 'Plomería y Agua': 'PLO', 'Ferretería y Herramientas': 'FER', 'Pinturas y Impermeabilizantes': 'PIN'
};

export default function ProductosPage() {
  const { productos, agregarProducto, actualizarStock, importarOActualizarProductosMasivo, restablecerInventario, actualizarProductoCompleto } = useInventario() as any;
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

  const [formProd, setFormProd] = useState({ nombre: '', categoria: 'Áridos', precio: '', stockActual: '', stockMinimo: '' });

  const handleAbrirCrear = () => {
    setProductoAEditar(null);
    setFormProd({ nombre: '', categoria: 'Áridos', precio: '', stockActual: '', stockMinimo: '' });
    setModalAbierto(true);
  };

  const handleAbrirEditar = (prod: Producto) => {
    setProductoAEditar(prod);
    setFormProd({
      nombre: prod.nombre,
      categoria: (prod as any).categoria || 'Áridos',
      precio: prod.precio.toString(),
      stockActual: prod.stockActual.toString(),
      stockMinimo: (prod as any).stockMinimo?.toString() || '5',
    });
    setModalAbierto(true);
  };

  const handleGuardarProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProd.nombre || !formProd.precio) return;

    if (productoAEditar) {
      // 1. Actualizamos datos generales (nombre, categoría, precio, stock mínimo)
      const productoActualizado = {
        ...productoAEditar,
        nombre: formProd.nombre,
        categoria: formProd.categoria,
        precio: parseFloat(formProd.precio) || 0,
        stockMinimo: parseInt(formProd.stockMinimo) || 5,
      };

      if (typeof actualizarProductoCompleto === 'function') {
        actualizarProductoCompleto(productoActualizado);
      }

      // 2. Si cambió el stock, gestionamos la diferencia mediante la función de stock
      const nuevoStock = parseInt(formProd.stockActual) || 0;
      const diferencia = nuevoStock - productoAEditar.stockActual;
      if (diferencia !== 0) {
        actualizarStock(productoAEditar.id, Math.abs(diferencia), diferencia > 0 ? 'entrada' : 'salida', 'stockActual');
      }
    } else {
      const prefijo = prefijosPorCategoria[formProd.categoria] || 'PRD';
      const codigoAutomatico = `${prefijo}-${Math.floor(100 + Math.random() * 900)}`;
      agregarProducto({
        id: codigoAutomatico, 
        codigo: codigoAutomatico, 
        nombre: formProd.nombre,
        categoria: formProd.categoria, 
        precio: parseFloat(formProd.precio) || 0,
        stockActual: parseInt(formProd.stockActual) || 0, 
        stockMinimo: parseInt(formProd.stockMinimo) || 5,
        cantidadReservada: 0, 
        cantidadEnAcopio: 0
      } as any);
    }
    setModalAbierto(false);
  };

  const procesarImportacionMasiva = (datosExcel: any[]) => {
    try {
      const prods = datosExcel.map(f => ({
        nombre: f['Producto'] || f['producto'] || f['NOMBRE'] || f['Nombre'] || 'Sin nombre',
        categoria: f['Categoria'] || f['categoria'] || f['CATEGORIA'] || 'Áridos',
        precio: Number(f['Precio Lista'] || f['precio lista'] || f['Precio'] || f['precio'] || 0),
        precioEfectivo: Number(f['Precio Efectivo'] || f['precio efectivo'] || 0),
        stock: Number(f['Stock'] || f['stock'] || f['STOCK'] || 0),
        proveedor: f['Proveedor'] || f['proveedor'] || ''
      }));
      importarOActualizarProductosMasivo(prods);
      alert('¡Importación masiva completada con éxito!');
    } catch (error) {
      alert('Error al procesar el archivo. Verifica las columnas de tu Excel.');
    }
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaProd = (p as any).categoria || 'Áridos';
    const coincideCategoria = categoriaSeleccionada === 'Todas' || categoriaProd === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div className="p-8 space-y-6">
      {/* PANEL SUPERIOR DE CARGA MASIVA Y RESETEO */}
      <div className="bg-slate-900 border border-amber-500/30 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Panel de Carga Masiva y Base de Datos</h2>
            <p className="text-xs text-slate-400">Importa tus productos desde Excel o limpia el sistema por completo.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ImportadorExcel onImportar={procesarImportacionMasiva} />
          <button 
            onClick={() => { if(confirm('¿Estás seguro de vaciar todo el sistema para cargar productos reales?')) restablecerInventario(); }}
            className="flex items-center gap-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Resetear Sistema
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-100">Catálogo de Productos</h1>
        <button onClick={handleAbrirCrear} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </div>

      {/* FILTROS DE CATEGORÍA Y BÚSQUEDA */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1">
          <span className="text-xs text-slate-400 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Cat:</span>
          <select 
            value={categoriaSeleccionada} 
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
            <tr>
              <th className="px-5 py-4">ID / Código</th>
              <th className="px-5 py-4">Categoría</th>
              <th className="px-5 py-4">Nombre</th>
              <th className="px-5 py-4 text-center">Stock</th>
              <th className="px-5 py-4 text-right">Precio</th>
              <th className="px-5 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="px-5 py-4 font-mono text-amber-500">{p.codigo}</td>
                  <td className="px-5 py-4 text-xs text-slate-400">{(p as any).categoria || 'Áridos'}</td>
                  <td className="px-5 py-4 font-medium text-white">{p.nombre}</td>
                  <td className="px-5 py-4 text-center font-bold text-emerald-400">{p.stockActual}</td>
                  <td className="px-5 py-4 text-right">${p.precio.toLocaleString('es-AR')}</td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => handleAbrirEditar(p)} className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No hay productos registrados con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-500" />
                {productoAEditar ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarProducto} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoría</label>
                <select value={formProd.categoria} onChange={(e) => setFormProd({...formProd, categoria: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500">
                  {categorias.filter(c => c !== 'Todas').map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre</label>
                <input type="text" required value={formProd.nombre} onChange={(e) => setFormProd({...formProd, nombre: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Precio ($)</label>
                  <input type="number" step="any" required value={formProd.precio} onChange={(e) => setFormProd({...formProd, precio: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Stock Actual</label>
                  <input type="number" value={formProd.stockActual} onChange={(e) => setFormProd({...formProd, stockActual: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={() => setModalAbierto(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm cursor-pointer">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}