'use client';

import { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Edit, 
  X,
  Download
} from 'lucide-react';
import { useInventario, Producto } from '@/context/InventarioContext';

const categorias = ['Todas', 'Áridos', 'Cementos y Cal', 'Ladrillos y Bloques', 'Hierros y Mallas', 'Perfiles y Chapas', 'Plomería y Agua', 'Ferretería y Herramientas', 'Pinturas y Impermeabilizantes'];

const prefijosPorCategoria: Record<string, string> = {
  'Áridos': 'ARI',
  'Cementos y Cal': 'CEM',
  'Ladrillos y Bloques': 'LAD',
  'Hierros y Mallas': 'HIE',
  'Perfiles y Chapas': 'PER',
  'Plomería y Agua': 'PLO',
  'Ferretería y Herramientas': 'FER',
  'Pinturas y Impermeabilizantes': 'PIN'
};

export default function ProductosPage() {
  const { productos, agregarProducto, actualizarStock } = useInventario();

  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [filtroStock, setFiltroStock] = useState<'todos' | 'normal' | 'bajo'>('todos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

  const [formProd, setFormProd] = useState({
    nombre: '',
    categoria: 'Áridos',
    precio: '',
    stockActual: '',
    stockMinimo: '',
  });

  const handleAbrirCrear = () => {
    setProductoAEditar(null);
    setFormProd({
      nombre: '',
      categoria: 'Áridos',
      precio: '',
      stockActual: '',
      stockMinimo: '',
    });
    setModalAbierto(true);
  };

  const handleAbrirEditar = (prod: Producto) => {
    setProductoAEditar(prod);
    setFormProd({
      nombre: prod.nombre,
      categoria: (prod as any).categoria || 'Áridos',
      precio: prod.precio.toString(),
      stockActual: prod.stockActual.toString(),
      stockMinimo: prod.stockMinimo.toString(),
    });
    setModalAbierto(true);
  };

  const handleGuardarProducto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProd.nombre || !formProd.precio) return;

    if (productoAEditar) {
      const nuevoStock = parseInt(formProd.stockActual) || 0;
      const diferenciaStock = nuevoStock - productoAEditar.stockActual;
      if (diferenciaStock !== 0) {
        actualizarStock(productoAEditar.id, Math.abs(diferenciaStock), diferenciaStock > 0 ? 'entrada' : 'salida', 'stockActual');
      }
    } else {
      // GENERACIÓN AUTOMÁTICA OBLIGATORIA: 3 LETRAS Y 3 NÚMEROS
      const prefijo = prefijosPorCategoria[formProd.categoria] || 'PRD';
      const numeroAleatorio = Math.floor(100 + Math.random() * 900);
      const codigoAutomatico = `${prefijo}-${numeroAleatorio}`;

      agregarProducto({
        id: codigoAutomatico,
        codigo: codigoAutomatico,
        nombre: formProd.nombre,
        categoria: formProd.categoria,
        precio: parseFloat(formProd.precio) || 0,
        stockActual: parseInt(formProd.stockActual) || 0,
        stockMinimo: parseInt(formProd.stockMinimo) || 5,
        cantidadReservada: 0,
        cantidadEnAcopio: 0,
      } as any);
    }

    setModalAbierto(false);
  };

  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaProd = (p as any).categoria || 'Áridos';
    const coincideCategoria = categoriaSeleccionada === 'Todas' || categoriaProd === categoriaSeleccionada;
    
    const bajoStock = p.stockActual <= p.stockMinimo;
    let coincideStock = true;
    if (filtroStock === 'bajo') coincideStock = bajoStock;
    if (filtroStock === 'normal') coincideStock = !bajoStock;

    return coincideBusqueda && coincideCategoria && coincideStock;
  });

  const exportarCSV = () => {
    const headers = ['ID / Codigo', 'Nombre del Producto', 'Stock Disponible', 'Cantidad Reservada', 'Cantidad en Acopio', 'Precio Unitario', 'Stock Minimo'];
    const rows = productosFiltrados.map(p => [
      `"${p.codigo}"`,
      `"${p.nombre.replace(/"/g, '""')}"`,
      p.stockActual,
      p.cantidadReservada,
      p.cantidadEnAcopio,
      p.precio,
      p.stockMinimo
    ]);

    const contenidoCSV = [
      headers.join(';'),
      ...rows.map(fila => fila.join(';'))
    ].join('\n');

    const blob = new Blob(["\ufeff" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_corralon_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalProductos = productos.length;
  const productosBajoStock = productos.filter(p => p.stockActual <= p.stockMinimo).length;
  const productosStockNormal = totalProductos - productosBajoStock;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-500" />
            Catálogo de Productos y Stock
          </h1>
          <p className="text-slate-400 mt-1">
            Control físico, reservas automáticas por pedidos y gestión de acopios.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={exportarCSV}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2.5 rounded-xl transition-all border border-slate-700 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          
          <button 
            onClick={handleAbrirCrear}
            className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button 
          onClick={() => setFiltroStock('todos')}
          className={`bg-slate-900 border p-5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            filtroStock === 'todos' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-medium text-slate-400">Total de Artículos</p>
            <p className="text-2xl font-bold text-slate-100 mt-1">{totalProductos}</p>
          </div>
          <div className="p-3 bg-slate-800 rounded-lg text-slate-300">
            <Package className="w-6 h-6" />
          </div>
        </button>

        <button 
          onClick={() => setFiltroStock(filtroStock === 'normal' ? 'todos' : 'normal')}
          className={`bg-slate-900 border p-5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            filtroStock === 'normal' ? 'border-emerald-500 ring-1 ring-emerald-500' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-medium text-slate-400">Stock Normal</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{productosStockNormal}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </button>

        <button 
          onClick={() => setFiltroStock(filtroStock === 'bajo' ? 'todos' : 'bajo')}
          className={`bg-slate-900 border p-5 rounded-xl flex items-center justify-between transition-all text-left cursor-pointer ${
            filtroStock === 'bajo' ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div>
            <p className="text-sm font-medium text-slate-400">Alertas de Reposición</p>
            <p className="text-2xl font-bold text-amber-500 mt-1">{productosBajoStock} Prod.</p>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-lg">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ID/código o nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <select
            value={categoriaSeleccionada}
            onChange={(e) => setCategoriaSeleccionada(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">ID Producto</th>
                <th className="px-5 py-4">Nombre del Producto</th>
                <th className="px-5 py-4 text-center">Disponible</th>
                <th className="px-5 py-4 text-center">Reservado</th>
                <th className="px-5 py-4 text-center">Acopio</th>
                <th className="px-5 py-4 text-right">Precio Unitario</th>
                <th className="px-5 py-4 text-center">Alerta Stock</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map((p) => {
                  const bajoStock = p.stockActual <= p.stockMinimo;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-amber-500">{p.codigo}</td>
                      <td className="px-5 py-4 font-medium text-slate-100">
                        {p.nombre}
                        <div className="text-xs text-slate-500">{(p as any).categoria}</div>
                      </td>
                      <td className="px-5 py-4 text-center font-bold text-slate-100 bg-slate-950/30">
                        {p.stockActual}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-sky-400">
                        {p.cantidadReservada}
                      </td>
                      <td className="px-5 py-4 text-center font-semibold text-purple-400">
                        {p.cantidadEnAcopio}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-emerald-400">
                        ${p.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {bajoStock ? (
                          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Reponer
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-1 rounded-full font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleAbrirEditar(p)}
                            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer" 
                            title="Editar Producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron productos con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-500" />
                {productoAEditar ? 'Editar Producto / Stock' : 'Agregar Nuevo Producto'}
              </h2>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarProducto} className="space-y-4">
              {!productoAEditar && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-xs text-amber-400 flex items-center gap-2">
                  <span>ℹ️ El ID único (3 letras y 3 números) se asignará automáticamente al guardar.</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Categoría del Material *</label>
                <select
                  value={formProd.categoria}
                  onChange={(e) => setFormProd({...formProd, categoria: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                >
                  {categorias.filter(c => c !== 'Todas').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cemento Avellaneda 50kg"
                  value={formProd.nombre}
                  onChange={(e) => setFormProd({...formProd, nombre: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Precio Unitario ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formProd.precio}
                    onChange={(e) => setFormProd({...formProd, precio: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Stock Mínimo (Alerta)</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={formProd.stockMinimo}
                    onChange={(e) => setFormProd({...formProd, stockMinimo: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Stock Actual (Físico Base)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={formProd.stockActual}
                  onChange={(e) => setFormProd({...formProd, stockActual: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {productoAEditar ? 'Guardar Cambios' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}