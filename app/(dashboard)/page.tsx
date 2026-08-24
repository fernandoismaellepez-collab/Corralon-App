'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInventario } from '@/context/InventarioContext';
import { Package, ClipboardList, AlertTriangle, TrendingUp, Users, ArrowUpRight, DollarSign, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { productos, pedidos, clientes, rolUsuario } = useInventario();

  // Protección de ruta: Si es operador, se le redirige al stock automáticamente
  useEffect(() => {
    if (rolUsuario === 'operador') {
      router.replace('/productos');
    }
  }, [rolUsuario, router]);

  if (rolUsuario === 'operador') {
    return null; // Evita que se renderice contenido mientras redirige
  }

  // Cálculos de métricas
  const totalProductos = productos.length;
  const stockCritico = productos.filter(p => p.stockActual <= p.stockMinimo).length;
  const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
  const totalClientes = clientes.length;

  const ingresosTotales = pedidos
    .filter(p => p.estado !== 'Cancelado')
    .reduce((acc, p) => acc + p.total, 0);

  const ultimosPedidos = pedidos.slice(0, 6);

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-screen">
      {/* CABECERA */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-amber-500" />
          Panel de Control
        </h1>
        <p className="text-slate-400 mt-1">Resumen ejecutivo de operaciones del corralón.</p>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Productos Activos', value: totalProductos, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { title: 'Stock Crítico', value: stockCritico, icon: AlertTriangle, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { title: 'Pedidos Pendientes', value: pedidosPendientes, icon: ClipboardList, color: 'text-sky-400', bg: 'bg-sky-500/10' },
          { title: 'Clientes Totales', value: totalClientes, icon: Users, color: 'text-purple-400', bg: 'bg-purple-500/10' }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.title}</p>
              <h3 className="text-3xl font-black text-white mt-1">{item.value}</h3>
            </div>
            <div className={`p-3.5 ${item.bg} ${item.color} rounded-xl border border-white/5`}>
              <item.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN FINANCIERA */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-slate-900 border border-emerald-900/30 p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Facturación Acumulada</h3>
            <p className="text-slate-400 text-sm">Suma total de pedidos vigentes y finalizados.</p>
          </div>
        </div>
        <div className="text-4xl font-black text-emerald-400 font-mono tracking-tighter">
          ${ingresosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* ÚLTIMOS PEDIDOS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Últimos movimientos</h3>
          <Link href="/pedidos" className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 bg-amber-500/10 px-4 py-2 rounded-lg transition-colors">
            Ver Gestión de Pedidos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="pb-4 pl-2">Nº Pedido</th>
                <th className="pb-4">Cliente</th>
                <th className="pb-4">Fecha</th>
                <th className="pb-4">Estado</th>
                <th className="pb-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ultimosPedidos.length > 0 ? (
                ultimosPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 pl-2 font-mono font-bold text-amber-400">{pedido.nroPedido}</td>
                    <td className="p-4 text-white font-medium">{pedido.nombreCliente}</td>
                    <td className="p-4 text-slate-400 text-xs">{pedido.fecha}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${
                        pedido.estado === 'Pendiente' ? 'bg-sky-500/10 text-sky-400' :
                        pedido.estado === 'Entregado' ? 'bg-emerald-500/10 text-emerald-400' :
                        'bg-rose-500/10 text-rose-400'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-white font-mono">
                      ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-600">No hay pedidos recientes.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}