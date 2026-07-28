'use client';
import { useInventario } from '@/context/InventarioContext';
import { Package, ClipboardList, AlertTriangle, TrendingUp, Users, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { productos, pedidos, clientes } = useInventario();

  const totalProductos = productos.length;
  const stockCritico = productos.filter(p => p.stockActual <= p.stockMinimo).length;
  const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
  const totalClientes = clientes.length;

  const ingresosTotales = pedidos
    .filter(p => p.estado !== 'Cancelado')
    .reduce((acc, p) => acc + p.total, 0);

  const ultimosPedidos = pedidos.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-amber-500" />
          Panel de Control
        </h1>
        <p className="text-slate-400 mt-1">
          Resumen general del inventario, pedidos y estado financiero del corralón.
        </p>
      </div>

      {/* Tarjetas de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Productos Activos</p>
            <h3 className="text-2xl font-black text-slate-100 mt-1">{totalProductos}</h3>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Crítico</p>
            <h3 className="text-2xl font-black text-rose-400 mt-1">{stockCritico}</h3>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pedidos Pendientes</p>
            <h3 className="text-2xl font-black text-sky-400 mt-1">{pedidosPendientes}</h3>
          </div>
          <div className="p-3 bg-sky-500/10 text-sky-500 rounded-xl border border-sky-500/20">
            <ClipboardList className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Clientes Registrados</p>
            <h3 className="text-2xl font-black text-purple-400 mt-1">{totalClientes}</h3>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tarjeta de Ingresos */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100">Facturación Acumulada (Pedidos Activos)</h3>
          <p className="text-slate-400 text-sm mt-0.5">Suma total de los pedidos vigentes y entregados en el sistema.</p>
        </div>
        <div className="text-3xl font-black text-emerald-400 bg-emerald-500/10 px-6 py-3 rounded-xl border border-emerald-500/20">
          ${ingresosTotales.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Sección Inferior: Tabla de Últimos Pedidos Recientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-100">Últimos Pedidos Registrados</h3>
          <Link href="/pedidos" className="text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1 font-medium">
            Ver todos <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/50 text-slate-400 uppercase text-xs">
              <tr>
                <th className="p-3 rounded-l-lg">Nº Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Fecha</th>
                <th className="p-3">Estado</th>
                <th className="p-3 text-right rounded-r-lg">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ultimosPedidos.length > 0 ? (
                ultimosPedidos.map((pedido) => (
                  <tr key={pedido.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-3 font-semibold text-amber-400">{pedido.nroPedido}</td>
                    <td className="p-3">{pedido.nombreCliente}</td>
                    <td className="p-3 text-slate-400">{pedido.fecha}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        pedido.estado === 'Pendiente' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' :
                        pedido.estado === 'Entregado' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        pedido.estado === 'Preparado' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-100">
                      ${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    No hay pedidos registrados todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}