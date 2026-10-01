'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInventario } from '@/context/InventarioContext';
import { Package, ClipboardList, AlertTriangle, TrendingUp, Users, ArrowUpRight, DollarSign, CalendarDays, Flame, ChevronRight, X, BarChart3, Award, ShoppingBag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default function DashboardPage() {
  const router = useRouter();
  const { productos, pedidos, clientes, rolUsuario } = useInventario();
  const [pedidosHistoricos, setPedidosHistoricos] = useState<any[]>([]);
  const [productoSeleccionadoDetalle, setProductoSeleccionadoDetalle] = useState<any>(null);
  
  // Pestaña activa para la sección de Inteligencia Comercial
  const [pestanaAnalitica, setPestanaAnalitica] = useState<'productos' | 'dias'>('productos');

  // Protección de ruta: Si es operador, se le redirige al stock automáticamente
  useEffect(() => {
    if (rolUsuario === 'operador') {
      router.replace('/productos');
    }
    cargarPedidosParaRanking();
  }, [rolUsuario, router]);

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

  if (rolUsuario === 'operador') {
    return null; 
  }

  // Cálculos de métricas ejecutivas
  const totalProductos = productos.length;
  const stockCritico = productos.filter(p => p.stockActual <= p.stockMinimo).length;
  const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
  const totalClientes = clientes.length;

  const ingresosTotales = pedidos
    .filter(p => p.estado !== 'Cancelado')
    .reduce((acc, p) => acc + p.total, 0);

  const ultimosPedidos = pedidos.slice(0, 5);

  // Rankings privados para el panel ejecutivo (Desde 1° de Septiembre)
  const rankingProductos = (() => {
    const fechaInicioNegocio = new Date(2026, 8, 1).getTime();
    const hoyTime = Date.now();
    const diffDias = Math.ceil((hoyTime - fechaInicioNegocio) / (1000 * 60 * 60 * 24));
    const diasActivos = diffDias > 0 ? diffDias : 1;

    const acumulador: Record<string, { nombre: string; unidadesVendidas: number; totalFacturado: number; detallePedidos: any[] }> = {};

    pedidosHistoricos.forEach((pedido: any) => {
      const estado = String(pedido.estado || pedido.status || '').trim().toLowerCase();
      if (estado === 'cancelado') return;

      const idPedido = pedido.id || pedido.nroPedido || 'S/N';
      const cliente = pedido.nombreCliente || 'Cliente General';
      const items = pedido.items || [];
      const fechaObj = parsearFechaLocal(pedido.fecha);

      items.forEach((item: any) => {
        const nombreProd = item.nombre || 'Producto Desconocido';
        const cantidad = Number(item.cantidad || 0);
        const subtotal = Number(item.subtotal || (Number(item.precioUnitario || 0) * cantidad));

        if (!acumulador[nombreProd]) {
          acumulador[nombreProd] = { nombre: nombreProd, unidadesVendidas: 0, totalFacturado: 0, detallePedidos: [] };
        }
        acumulador[nombreProd].unidadesVendidas += cantidad;
        acumulador[nombreProd].totalFacturado += subtotal;
        
        acumulador[nombreProd].detallePedidos.push({
          idPedido,
          cliente,
          cantidad,
          fecha: pedido.fecha ? fechaObj.toLocaleDateString('es-AR') : 'Fecha no registrada'
        });
      });
    });

    return Object.values(acumulador).map(prod => {
      const promedioDiario = prod.unidadesVendidas / diasActivos;
      const proyeccionSemanal = promedioDiario * 7;
      const prodInventario = productos.find((p: any) => p.nombre.toLowerCase() === prod.nombre.toLowerCase());
      const stockActualProd = prodInventario ? prodInventario.stockActual : 0;
      const stockMinimoProd = prodInventario ? (prodInventario.stockMinimo || 5) : 5;

      return {
        ...prod,
        stockActual: stockActualProd,
        stockMinimo: stockMinimoProd,
        esCritico: stockActualProd <= stockMinimoProd,
        promedioDiario: Number(promedioDiario.toFixed(2)),
        proyeccionSemanal: Number(proyeccionSemanal.toFixed(1))
      };
    }).sort((a, b) => b.unidadesVendidas - a.unidadesVendidas);
  })();

  const rankingDiasExactos = (() => {
    const diasMap: Record<string, { fecha: string; totalFacturado: number; cantidadPedidos: number }> = {};
    const limiteInicio = new Date(2026, 8, 1).getTime();

    pedidosHistoricos.forEach((pedido: any) => {
      const estado = String(pedido.estado || pedido.status || '').trim().toLowerCase();
      if (estado === 'cancelado' || !pedido.fecha) return;

      const fechaObj = parsearFechaLocal(pedido.fecha);
      if (fechaObj.getTime() < limiteInicio) return;

      const fechaStr = fechaObj.toLocaleDateString('es-AR');
      const montoTotal = Number(pedido.total || 0);

      if (!diasMap[fechaStr]) {
        diasMap[fechaStr] = { fecha: fechaStr, totalFacturado: 0, cantidadPedidos: 0 };
      }
      diasMap[fechaStr].totalFacturado += montoTotal;
      diasMap[fechaStr].cantidadPedidos += 1;
    });

    return Object.values(diasMap).sort((a, b) => b.totalFacturado - a.totalFacturado);
  })();

  const rankingDiasSemana = (() => {
    const semMap: Record<string, { nombreDia: string; totalFacturado: number; cantidadPedidos: number; apariciones: number }> = {
      'Lunes': { nombreDia: 'Lunes', totalFacturado: 0, cantidadPedidos: 0, apariciones: 0 },
      'Martes': { nombreDia: 'Martes', totalFacturado: 0, cantidadPedidos: 0, apariciones: 0 },
      'Miércoles': { nombreDia: 'Miércoles', totalFacturado: 0, cantidadPedidos: 0, apariciones: 0 },
      'Jueves': { nombreDia: 'Jueves', totalFacturado: 0, cantidadPedidos: 0, apariciones: 0 },
      'Viernes': { nombreDia: 'Viernes', totalFacturado: 0, cantidadPedidos: 0, apariciones: 0 },
      'Sábado': { nombreDia: 'Sábado', totalFacturado: 0, cantidadPedidos: 0, apariciones: 0 },
    };

    const limiteInicio = new Date(2026, 8, 1).getTime();
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const contadorFechasUnicasPorDia: Record<string, Set<string>> = {
      'Lunes': new Set(), 'Martes': new Set(), 'Miércoles': new Set(),
      'Jueves': new Set(), 'Viernes': new Set(), 'Sábado': new Set()
    };

    pedidosHistoricos.forEach((pedido: any) => {
      const estado = String(pedido.estado || pedido.status || '').trim().toLowerCase();
      if (estado === 'cancelado' || !pedido.fecha) return;

      const fechaObj = parsearFechaLocal(pedido.fecha);
      if (fechaObj.getTime() < limiteInicio) return;

      const diaIndex = fechaObj.getDay();
      if (diaIndex === 0) return;

      const nombreDiaReal = nombresDias[diaIndex];
      const fechaStrKey = fechaObj.toISOString().split('T')[0];

      if (contadorFechasUnicasPorDia[nombreDiaReal]) {
        contadorFechasUnicasPorDia[nombreDiaReal].add(fechaStrKey);
      }

      if (semMap[nombreDiaReal]) {
        semMap[nombreDiaReal].totalFacturado += Number(pedido.total || 0);
        semMap[nombreDiaReal].cantidadPedidos += 1;
      }
    });

    Object.keys(semMap).forEach(k => {
      const count = contadorFechasUnicasPorDia[k]?.size || 0;
      semMap[k].apariciones = count > 0 ? count : 1;
    });

    return Object.values(semMap).map(item => ({
      ...item,
      promedioFacturacionDiario: item.totalFacturado / item.apariciones
    })).sort((a, b) => b.totalFacturado - a.totalFacturado);
  })();

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen text-slate-100">
      
      {/* 1. CABECERA EJECUTIVA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs font-mono font-bold mb-2">
            <Award className="w-3.5 h-3.5" /> MODO EJECUTIVO / GERENCIA
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-500" />
            Tablero de Control del Corralón
          </h1>
          <p className="text-slate-400 text-sm mt-1">Visión global de inventario, finanzas y comportamiento de demanda (Desde el 1° de Septiembre).</p>
        </div>

        {/* FACTURACIÓN DESTACADA EN CABECERA */}
        <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
            <DollarSign className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">Facturación Acumulada</span>
            <span className="text-2xl font-black font-mono text-white tracking-tight">
              ${ingresosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TARJETAS DE SEMÁFORO (KPIs CLAVE) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { title: 'Productos Activos', value: totalProductos, icon: Package, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-slate-800' },
          { title: 'Stock Crítico', value: stockCritico, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10', border: stockCritico > 0 ? 'border-rose-500/40 shadow-rose-950/20 shadow-lg' : 'border-slate-800' },
          { title: 'Pedidos Pendientes', value: pedidosPendientes, icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-slate-800' },
          { title: 'Clientes Totales', value: totalClientes, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-slate-800' }
        ].map((item, idx) => (
          <div key={idx} className={`bg-slate-900 border ${item.border} p-5 rounded-2xl shadow-lg flex items-center justify-between transition-all hover:border-slate-700`}>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{item.title}</p>
              <h3 className="text-3xl font-black text-white mt-1 font-mono">{item.value}</h3>
            </div>
            <div className={`p-3.5 ${item.bg} ${item.color} rounded-2xl border border-white/5`}>
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. CENTRO DE INTELIGENCIA COMERCIAL (RANKINGS CON PESTAÑAS) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Cabecera y Selector de Pestañas */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-500" /> Inteligencia Comercial y Demanda
            </h2>
            <p className="text-xs text-slate-400">Analiza qué se vende más y qué días rinden mejor para optimizar stock y compras.</p>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setPestanaAnalitica('productos')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${pestanaAnalitica === 'productos' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <Package className="w-4 h-4" /> Ranking de Productos
            </button>
            <button
              onClick={() => setPestanaAnalitica('dias')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${pestanaAnalitica === 'dias' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              <CalendarDays className="w-4 h-4" /> Días de Mayor Venta
            </button>
          </div>
        </div>

        {/* VISTA A: RANKING DE PRODUCTOS (SIN PORCENTAJES CONFUSOS) */}
        {pestanaAnalitica === 'productos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse"></span>
                Haz clic en cualquier tarjeta para ver el desglose de clientes y pedidos.
              </span>
              <span className="font-mono bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 text-amber-400 font-bold">
                Total analizados: {rankingProductos.length} productos
              </span>
            </div>

            {/* GRILLA DE TARJETAS DE PRODUCTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rankingProductos.length > 0 ? (
                rankingProductos.map((prod, index) => (
                  <div
                    key={index}
                    onClick={() => setProductoSeleccionadoDetalle(prod)}
                    className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl shadow-lg transition-all cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden group"
                  >
                    {/* Indicador de Stock Crítico sutil si aplica */}
                    {prod.esCritico && (
                      <div className="absolute top-0 right-0 bg-rose-600/20 border-b border-l border-rose-500/40 text-rose-400 text-[10px] font-mono px-2.5 py-1 rounded-bl-xl flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 animate-pulse" /> Stock Crítico ({prod.stockActual})
                      </div>
                    )}

                    {/* Cabecera de la Tarjeta */}
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-md ${
                          index === 0 ? 'bg-amber-500 text-slate-950' :
                          index === 1 ? 'bg-slate-300 text-slate-950' :
                          index === 2 ? 'bg-amber-700 text-white' :
                          'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-1">{prod.nombre}</h4>
                          <span className="text-[11px] text-slate-400 font-mono">Facturado: <strong className="text-emerald-400">${prod.totalFacturado.toLocaleString('es-AR')}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Sección de Unidades Vendidas (Limpia, sin porcentajes) */}
                    <div className="bg-slate-900/60 border border-slate-900 p-3 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-slate-400 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-amber-500" /> Total Vendidos:
                      </span>
                      <span className="font-mono font-bold text-white text-base">{prod.unidadesVendidas} un.</span>
                    </div>

                    {/* Métricas clave abajo (Ritmo y Proyección) */}
                    <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Ritmo Diario</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">{prod.promedioDiario} un/día</span>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/60">
                        <span className="text-[10px] text-slate-400 block uppercase font-mono">Proyección 7d</span>
                        <span className="font-mono font-bold text-cyan-400 text-sm">{prod.proyeccionSemanal} un</span>
                      </div>
                    </div>

                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  No hay suficientes registros de ventas desde el 1 de septiembre para calcular el ranking.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VISTA B: DÍAS DE MAYOR VENTA */}
        {pestanaAnalitica === 'dias' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Récord por Días de la Semana */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Flame className="w-4 h-4 text-amber-500" /> Rendimiento por Día Hábil (Lun - Sáb)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Podio</th>
                      <th className="px-3 py-2.5">Día</th>
                      <th className="px-3 py-2.5 text-center">Pedidos</th>
                      <th className="px-3 py-2.5 text-right">Facturación Total</th>
                      <th className="px-3 py-2.5 text-right text-amber-400">Prom. Diario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {rankingDiasSemana.length > 0 ? (
                      rankingDiasSemana.map((sem, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="px-3 py-3 text-center font-mono font-bold">
                            {idx === 0 ? <span className="text-amber-400 text-sm">🥇</span> : idx === 1 ? <span className="text-slate-300 text-sm">🥈</span> : idx === 2 ? <span className="text-amber-700 text-sm">🥉</span> : `#${idx+1}`}
                          </td>
                          <td className="px-3 py-3 font-bold text-white">{sem.nombreDia}</td>
                          <td className="px-3 py-3 text-center font-mono">{sem.cantidadPedidos}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">${sem.totalFacturado.toLocaleString('es-AR')}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-amber-400">${Math.round(sem.promedioFacturacionDiario).toLocaleString('es-AR')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={5} className="text-center py-6 text-slate-500">Sin datos de ventas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Récord por Fechas Exactas */}
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <CalendarDays className="w-4 h-4 text-amber-500" /> Top Fechas Calendario
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5 text-center">Pos</th>
                      <th className="px-3 py-2.5">Fecha</th>
                      <th className="px-3 py-2.5 text-center">Pedidos</th>
                      <th className="px-3 py-2.5 text-right">Facturación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs">
                    {rankingDiasExactos.length > 0 ? (
                      rankingDiasExactos.slice(0, 6).map((dia, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/60">
                          <td className="px-3 py-3 text-center font-mono font-bold">
                            {idx === 0 ? <span className="text-amber-400 text-sm">🥇</span> : idx === 1 ? <span className="text-slate-300 text-sm">🥈</span> : idx === 2 ? <span className="text-amber-700 text-sm">🥉</span> : `#${idx+1}`}
                          </td>
                          <td className="px-3 py-3 font-mono text-white font-bold">{dia.fecha}</td>
                          <td className="px-3 py-3 text-center font-mono">{dia.cantidadPedidos}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-emerald-400">${dia.totalFacturado.toLocaleString('es-AR')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} className="text-center py-6 text-slate-500">Sin datos de ventas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* 4. ÚLTIMOS MOVIMIENTOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-amber-500" /> Últimos Movimientos Operativos
          </h3>
          <Link href="/pedidos" className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-4 py-2 rounded-xl transition-colors">
            Ver Gestión de Pedidos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="pb-3 pl-2">Nº Pedido</th>
                <th className="pb-3">Cliente</th>
                <th className="pb-3">Fecha</th>
                <th className="pb-3">Estado</th>
                <th className="pb-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {ultimosPedidos.length > 0 ? (
                ultimosPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 pl-2 font-mono font-bold text-amber-400">{pedido.nroPedido}</td>
                    <td className="p-3.5 text-white font-medium">{pedido.nombreCliente}</td>
                    <td className="p-3.5 text-slate-400">{pedido.fecha}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        pedido.estado === 'Pendiente' ? 'bg-sky-500/10 text-sky-400' :
                        pedido.estado === 'Entregado' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-bold text-white font-mono">
                      ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-600">No hay pedidos recientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE DE PEDIDOS POR PRODUCTO */}
      {productoSeleccionadoDetalle && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="w-5 h-5 text-amber-500" /> {productoSeleccionadoDetalle.nombre}
                </h3>
                <p className="text-xs text-slate-400">Desglose de pedidos, clientes y análisis de demanda.</p>
              </div>
              <button onClick={() => setProductoSeleccionadoDetalle(null)} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Promedio Diario:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">{productoSeleccionadoDetalle.promedioDiario} un/día</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 block">Proyección Semanal:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{productoSeleccionadoDetalle.proyeccionSemanal} un/sem.</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Pedidos Asociados ({productoSeleccionadoDetalle.detallePedidos.length})</span>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                {productoSeleccionadoDetalle.detallePedidos.map((ped: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white font-bold font-mono">{ped.idPedido}</span>
                      <span className="block text-[11px] text-slate-400">Cliente: <strong className="text-slate-200">{ped.cliente}</strong> ({ped.fecha})</span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-lg font-mono font-bold">
                      {ped.cantidad} un.
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setProductoSeleccionadoDetalle(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}