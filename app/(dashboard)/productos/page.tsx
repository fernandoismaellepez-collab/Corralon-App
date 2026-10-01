'use client';
export const dynamic = 'force-dynamic';

import { useState, useRef, useEffect } from 'react';
import { Package, Plus, Search, Filter, Edit, X, Trash2, ShoppingCart, Check, Minus, BarChart3, AlertTriangle } from 'lucide-react';
import { useInventario, Producto } from '@/context/InventarioContext';
import ImportadorExcel from '@/components/ImportadorExcel';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

const CATEGORIAS_CORRALON = ['Áridos', 'Cementos y Cal', 'Ladrillos y Bloques', 'Hierros y Mallas', 'Perfiles y Chapas'];

const categorias = ['Todas', 'Áridos', 'Cementos y Cal', 'Ladrillos y Bloques', 'Hierros y Mallas', 'Perfiles y Chapas', 'Plomería y Agua', 'Ferretería y Herramientas', 'Pinturas y Impermeabilizantes'];

const prefijosPorCategoria: Record<string, string> = {
  'Áridos': 'ARI', 'Cementos y Cal': 'CEM', 'Ladrillos y Bloques': 'LAD', 'Hierros y Mallas': 'HIE',
  'Perfiles y Chapas': 'PER', 'Plomería y Agua': 'PLO', 'Ferretería y Herramientas': 'FER', 'Pinturas y Impermeabilizantes': 'PIN'
};

const parsearFechaLocal = (fechaStr: string) => {
  if (!fechaStr) return new Date();
  if (fechaStr.includes('T')) {
    const soloFecha = fechaStr.split('T')[0];
    const partes = soloFecha.split('-');
    if (partes.length === 3) {
      return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
    }
  }
  const partes = fechaStr.split('-');
  if (partes.length === 3) {
    return new Date(Number(partes[0]), Number(partes[1]) - 1, Number(partes[2]));
  }
  return new Date(fechaStr);
};

export default function ProductosPage() {
  const { productos, agregarProducto, actualizarStock, importarOActualizarProductosMasivo, restablecerInventario, actualizarProductoCompleto } = useInventario() as any;
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todas');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoAEditar, setProductoAEditar] = useState<Producto | null>(null);

  const [pedidosHistoricos, setPedidosHistoricos] = useState<any[]>([]);

  const [carritoMostrador, setCarritoMostrador] = useState<any[]>([]);
  const [desplegableCarritoAbierto, setDesplegableCarritoAbierto] = useState(false);
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);

  const [nombreClienteVenta, setNombreClienteVenta] = useState('Cliente Mostrador');
  const [medioPagoVenta, setMedioPagoVenta] = useState<'efectivo' | 'transferencia'>('efectivo');

  const [posicionCarrito, setPosicionCarrito] = useState({ x: 500, y: 120 });
  const [arrastrando, setArrastrando] = useState(false);
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosicionCarrito({ x: window.innerWidth - 120, y: 120 });
    }
    cargarPedidosParaRanking();
  }, []);

  const cargarPedidosParaRanking = async () => {
    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'pedidos')
        .single();

      if (!error && data?.payload) {
        setPedidosHistoricos(data.payload);
      }
    } catch (err) {
      console.error('Error al cargar pedidos históricos:', err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setArrastrando(true);
    offsetRef.current = {
      x: e.clientX - posicionCarrito.x,
      y: e.clientY - posicionCarrito.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!arrastrando) return;
    setPosicionCarrito({
      x: e.clientX - offsetRef.current.x,
      y: e.clientY - offsetRef.current.y
    });
  };

  const handleMouseUp = () => {
    setArrastrando(false);
  };

  const [formProd, setFormProd] = useState({ nombre: '', categoria: 'Áridos', precio: '', stockActual: '', stockMinimo: '5' });

  const handleAbrirCrear = () => {
    setProductoAEditar(null);
    setFormProd({ nombre: '', categoria: 'Áridos', precio: '', stockActual: '', stockMinimo: '5' });
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
        stockMinimo: Number(f['Stock Minimo'] || f['stock minimo'] || f['Stock Mínimo'] || 5),
        proveedor: f['Proveedor'] || f['proveedor'] || ''
      }));
      importarOActualizarProductosMasivo(prods);
      alert('¡Importación masiva completada con éxito!');
    } catch (error) {
      alert('Error al procesar el archivo. Verifica las columnas de tu Excel.');
    }
  };

  const agregarAlCarrito = (prod: any) => {
    setCarritoMostrador(prev => {
      const existe = prev.find(item => item.id === prod.id);
      if (existe) {
        return prev.map(item => item.id === prod.id ? { ...item, cantidad: item.cantidad + 1 } : item);
      }
      return [...prev, { ...prod, cantidad: 1 }];
    });
  };

  const cambiarCantidadCarrito = (id: string, delta: number) => {
    setCarritoMostrador(prev => prev.map(item => {
      if (item.id === id) {
        const nuevaCant = item.cantidad + delta;
        return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const totalCarrito = carritoMostrador.reduce((acc, item) => acc + (Number(item.precio || 0) * item.cantidad), 0);
  const totalItemsCount = carritoMostrador.reduce((acc, item) => acc + item.cantidad, 0);

  const procesarCobroFinal = async () => {
    if (carritoMostrador.length === 0) return;
    const clienteFinal = nombreClienteVenta.trim() || 'Cliente Mostrador';
    const idPedido = 'PED-' + Date.now().toString().slice(-11);

    const fechaHoyLocal = new Date().toISOString().split('T')[0];

    const nuevoPedido = {
      id: idPedido,
      nombreCliente: clienteFinal,
      total: totalCarrito,
      estado: 'Entregado',
      medioPago: medioPagoVenta,
      fecha: fechaHoyLocal,
      items: carritoMostrador.map(i => ({
        id: i.id,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precio,
        subtotal: i.precio * i.cantidad
      }))
    };

    try {
      const { data: appData, error: appError } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'pedidos')
        .single();

      const pedidosActuales = (!appError && appData?.payload) ? appData.payload : [];
      const pedidosActualizados = [nuevoPedido, ...pedidosActuales];

      await supabase
        .from('app_data')
        .upsert([{
          id: 'pedidos',
          payload: pedidosActualizados,
          updated_at: new Date().toISOString()
        }]);

      const { data: appTurnos } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'caja_turnos_estado')
        .single();

      const turnoAbierto = appTurnos?.payload?.turnoAbierto;
      if (turnoAbierto && turnoAbierto.id) {
        const { data: appCobros } = await supabase
          .from('app_data')
          .select('payload')
          .eq('id', `caja_cobros_${turnoAbierto.id}`)
          .single();

        const cobrosActuales = appCobros?.payload || [];
        const nuevoCobroCaja = {
          id: 'cobro_' + Date.now(),
          pedidoId: idPedido,
          cliente: clienteFinal,
          monto: totalCarrito,
          medioPago: medioPagoVenta,
          cobradoEn: new Date().toISOString()
        };

        await supabase
          .from('app_data')
          .upsert([{
            id: `caja_cobros_${turnoAbierto.id}`,
            payload: [nuevoCobroCaja, ...cobrosActuales],
            updated_at: new Date().toISOString()
          }]);
      }

      carritoMostrador.forEach(item => {
        if (typeof actualizarStock === 'function') {
          actualizarStock(item.id, item.cantidad, 'salida', 'stockActual');
        }
      });

      alert(`¡Venta #${idPedido} cobrada y registrada con éxito en caja!`);
      setCarritoMostrador([]);
      setModalCobroAbierto(false);
      setDesplegableCarritoAbierto(false);
      await cargarPedidosParaRanking();
    } catch (err: any) {
      alert('Error al procesar el cobro: ' + err.message);
    }
  };

  const productosStockCritico = productos.filter((p: any) => {
    const categoriaProd = (p as any).categoria || 'Áridos';
    if (!CATEGORIAS_CORRALON.includes(categoriaProd)) return false;
    return Number(p.stockActual || 0) <= Number(p.stockMinimo || 5);
  });

  const estadisticasGeneralesDesdeSep = (() => {
    const limiteInicio = new Date(2026, 8, 1).getTime();
    let totalPedidosGlobal = 0;

    pedidosHistoricos.forEach((pedido: any) => {
      const estado = String(pedido.estado || pedido.status || '').trim().toLowerCase();
      if (estado === 'cancelado' || !pedido.fecha) return;

      const fechaObj = parsearFechaLocal(pedido.fecha);
      if (fechaObj.getTime() < limiteInicio) return;

      totalPedidosGlobal += 1;
    });

    return { totalPedidosGlobal };
  })();

  const productosFiltrados = productos.filter((p: any) => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const categoriaProd = (p as any).categoria || 'Áridos';
    const coincideCategoria = categoriaSeleccionada === 'Todas' || categoriaProd === categoriaSeleccionada;
    return coincideBusqueda && coincideCategoria;
  });

  return (
    <div 
      className="p-8 space-y-6 relative min-h-screen select-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* BOTÓN FLOTANTE DRAGGABLE DE CARRITO */}
      <div 
        style={{ transform: `translate(${posicionCarrito.x}px, ${posicionCarrito.y}px)` }}
        className="fixed z-50 cursor-grab active:cursor-grabbing top-0 left-0"
        onMouseDown={handleMouseDown}
      >
        <div className="relative">
          <button
            onClick={() => setDesplegableCarritoAbierto(!desplegableCarritoAbierto)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 p-3.5 rounded-full shadow-2xl flex items-center justify-center border-2 border-slate-950 transition-transform active:scale-95 cursor-pointer"
            title="Arrastra para mover o haz clic para ver la compra"
          >
            <ShoppingCart className="w-6 h-6" />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-950 shadow-lg animate-pulse">
                {totalItemsCount}
              </span>
            )}
          </button>
        </div>

        {/* DESPLEGABLE DEL CARRITO */}
        {desplegableCarritoAbierto && (
          <div className="absolute right-0 mt-3 w-80 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-2xl space-y-3 cursor-default">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-400 uppercase flex items-center gap-1.5">
                <ShoppingCart className="w-4 h-4" /> Venta en Curso ({totalItemsCount})
              </span>
              <button onClick={() => setDesplegableCarritoAbierto(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-4 h-4" /></button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {carritoMostrador.length > 0 ? (
                carritoMostrador.map((item, idx) => (
                  <div key={idx} className="bg-slate-950 p-2.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white font-medium block">{item.nombre}</span>
                      <span className="text-[10px] text-amber-400 font-mono">${Number(item.precio).toLocaleString('es-AR')} c/u</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center bg-slate-900 rounded border border-slate-800">
                        <button onClick={() => cambiarCantidadCarrito(item.id, -1)} className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"><Minus className="w-3 h-3" /></button>
                        <span className="px-2 font-mono text-white">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidadCarrito(item.id, 1)} className="px-1.5 py-0.5 text-slate-400 hover:text-white cursor-pointer"><Plus className="w-3 h-3" /></button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500 text-xs">
                  El carrito está vacío. Haz clic en "Agregar" en los productos.
                </div>
              )}
            </div>

            {carritoMostrador.length > 0 && (
              <>
                <div className="border-t border-slate-800 pt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Total:</span>
                  <span className="font-mono font-bold text-emerald-400 text-base">${totalCarrito.toLocaleString('es-AR')}</span>
                </div>

                <button
                  onClick={() => setModalCobroAbierto(true)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <Check className="w-4 h-4" /> Finalizar Pedido y Cobrar
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* NOTIFICACIONES DE STOCK CRÍTICO */}
      {productosStockCritico.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/40 p-4 rounded-2xl flex items-start gap-3 shadow-xl">
          <div className="p-2 bg-rose-500/20 text-rose-400 rounded-xl mt-0.5">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
              ⚠️ Alerta de Stock Crítico - Materiales de Corralón ({productosStockCritico.length} producto/s)
            </h3>
            <div className="flex flex-wrap gap-2 pt-1">
              {productosStockCritico.map((prod: any, idx: number) => (
                <span key={idx} className="bg-slate-950 border border-rose-500/30 text-xs text-rose-200 px-2.5 py-1 rounded-lg font-mono">
                  <strong>{prod.nombre}</strong> (Stock: <span className="text-rose-400 font-bold">{prod.stockActual}</span> / Mín: {prod.stockMinimo || 5})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

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

      {/* TARJETA DE MÉTRICA GLOBAL DE PEDIDOS */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total de Pedidos (Desde 1° Sep)</span>
            <h3 className="text-2xl font-black font-mono text-amber-400">{estadisticasGeneralesDesdeSep.totalPedidosGlobal} pedidos</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
            <BarChart3 className="w-7 h-7" />
          </div>
        </div>
      </div>

      {/* CABECERA LIMPIA (SIN PESTAÑAS DE RANKING) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-bold text-amber-400">
          <Package className="w-4 h-4" /> Catálogo y Venta General
        </div>

        <button onClick={handleAbrirCrear} className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 cursor-pointer">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </div>

      {/* VISTA DE CATALOGO Y VENTA RÁPIDA */}
      <div className="space-y-6">
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
                <th className="px-5 py-4 text-center">Stock Actual</th>
                <th className="px-5 py-4 text-center">Stock Mín.</th>
                <th className="px-5 py-4 text-right">Precio</th>
                <th className="px-5 py-4 text-center">Venta Mostrador</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {productosFiltrados.length > 0 ?
               productosFiltrados.map((p: any) => {
                  const stockActualNum = Number(p.stockActual || 0);
                  const stockMinNum = Number(p.stockMinimo || 5);
                  const catProd = p.categoria || 'Áridos';
                  const esCritico = CATEGORIAS_CORRALON.includes(catProd) && stockActualNum <= stockMinNum;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-4 font-mono text-amber-500">{p.codigo}</td>
                      <td className="px-5 py-4 text-xs text-slate-400">{catProd}</td>
                      <td className="px-5 py-4 font-medium text-white flex items-center gap-2">
                        {p.nombre}
                        {esCritico && (
                          <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                            Stock Crítico
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-bold">
                        <span className={esCritico ? 'text-rose-400 font-mono text-sm animate-pulse' : 'text-emerald-400'}>
                          {p.stockActual}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-mono text-slate-400">
                        {p.stockMinimo || 5}
                      </td>
                      <td className="px-5 py-4 text-right">${p.precio.toLocaleString('es-AR')}</td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => agregarAlCarrito(p)}
                          className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agregar
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button onClick={() => handleAbrirEditar(p)} className="p-1.5 text-slate-400 hover:text-amber-400 cursor-pointer">
                          <Edit className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
               : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No hay productos registrados con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE COBRO PROFESIONAL */}
      {modalCobroAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> Finalizar y Cobrar Venta
              </h3>
              <button onClick={() => setModalCobroAbierto(false)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nombre del Cliente / Razón Social</label>
                <input
                  type="text"
                  value={nombreClienteVenta}
                  onChange={(e) => setNombreClienteVenta(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Medio de Pago</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMedioPagoVenta('efectivo')}
                    className={`py-2.5 rounded-xl font-bold border transition-colors cursor-pointer ${medioPagoVenta === 'efectivo' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setMedioPagoVenta('transferencia')}
                    className={`py-2.5 rounded-xl font-bold border transition-colors cursor-pointer ${medioPagoVenta === 'transferencia' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                  >
                    Transferencia
                  </button>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase tracking-wider block font-mono text-[10px]">Resumen de Ítems</span>
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {carritoMostrador.map((i, idx) => (
                    <div key={idx} className="flex justify-between text-slate-300">
                      <span>{i.cantidad}x {i.nombre}</span>
                      <span className="font-mono">${(i.precio * i.cantidad).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-white">
                  <span>Total a Cobrar:</span>
                  <span className="font-mono text-emerald-400 text-base">${totalCarrito.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setModalCobroAbierto(false)} className="flex-1 bg-slate-800 text-slate-300 text-xs font-bold py-3 rounded-xl cursor-pointer">Cancelar</button>
              <button onClick={procesarCobroFinal} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-3 rounded-xl cursor-pointer shadow-lg">Finalizar y Cobrar</button>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Stock Mínimo (Alerta de reposición)</label>
                <input type="number" value={formProd.stockMinimo} onChange={(e) => setFormProd({...formProd, stockMinimo: e.target.value})} className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500" />
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