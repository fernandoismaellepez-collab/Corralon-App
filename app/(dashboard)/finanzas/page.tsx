'use client';

import React, { useState } from 'react';
import { useInventario } from '@/context/InventarioContext';
import { ProveedoresProvider, useProveedores } from '@/context/ProveedoresContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  ArrowUpRight,
  PackageCheck,
  Calculator
} from 'lucide-react';

function FinanzasContent() {
  const { productos, pedidos, gastosFijos, setGastosFijos } = useInventario();
  const { proveedores } = useProveedores();
  
  const [editandoGastos, setEditandoGastos] = useState(false);
  const [tempGastosFijos, setTempGastosFijos] = useState(gastosFijos);

  // 1. Cálculo de Facturación Total (Ventas vigentes o entregadas)
  const ventasValidas = pedidos.filter(p => p.estado !== 'Cancelado');
  const facturacionTotal = ventasValidas.reduce((acc, p) => acc + Number(p.total || 0), 0);

  // 2. Cálculo de Gastos Variables (Costo real cruzado con los artículos de Proveedores)
  let costoTotalVendido = 0;
  ventasValidas.forEach(pedido => {
    pedido.items.forEach(item => {
      let costoUnitario = 0;
      
      for (const prov of proveedores) {
        if (prov.productosOfrecidos) {
          const articuloProv = prov.productosOfrecidos.find(
            (ap: any) => ap.codigoProducto === item.codigo || ap.nombreProducto?.toLowerCase() === item.nombre.toLowerCase()
          );
          if (articuloProv && articuloProv.precioUnitarioActual) {
            costoUnitario = articuloProv.precioUnitarioActual;
            break;
          }
        }
      }

      if (costoUnitario === 0) {
        costoUnitario = item.precioUnitario * 0.7;
      }

      costoTotalVendido += costoUnitario * item.cantidad;
    });
  });

  // 3. Márgenes y Utilidad
  const margenBruto = facturacionTotal - costoTotalVendido;
  const utilidadNeta = margenBruto - gastosFijos;
  
  const porcentajeGastosCubiertos = gastosFijos > 0 ? Math.min(100, (margenBruto / gastosFijos) * 100) : 100;
  const gastosCubiertos = margenBruto >= gastosFijos;

  // 4. Previsibilidad y Alertas de Stock (Sugerencias de Compra)
  const productosCriticos = productos.filter(p => Number(p.stockActual) <= Number(p.stockMinimo));

  const guardarGastosFijos = (e: React.FormEvent) => {
    e.preventDefault();
    setGastosFijos(Number(tempGastosFijos));
    setEditandoGastos(false);
  };

  return (
    <div className="space-y-8 pb-12 text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-500" />
            Finanzas y Previsibilidad
          </h1>
          <p className="text-slate-400 mt-1">
            Análisis de rentabilidad, costos variables reales por proveedor, margen neto y reposición inteligente.
          </p>
        </div>

        <button
          onClick={() => setEditandoGastos(!editandoGastos)}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-200 flex items-center gap-2 transition cursor-pointer"
        >
          <Calculator className="w-4 h-4 text-amber-500" />
          Configurar Gastos Fijos (${gastosFijos.toLocaleString()})
        </button>
      </div>

      {editandoGastos && (
        <form onSubmit={guardarGastosFijos} className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl shadow-xl max-w-md space-y-4">
          <h3 className="text-md font-bold text-slate-100">Actualizar Gastos Fijos Mensuales</h3>
          <p className="text-xs text-slate-400">Ingresa la suma total de alquiler, sueldos, servicios e impuestos fijos.</p>
          <input
            type="number"
            value={tempGastosFijos}
            onChange={(e) => setTempGastosFijos(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditandoGastos(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs"
            >
              Guardar
            </button>
          </div>
        </form>
      )}

      {/* SECCIÓN DE LOGROS Y COBERTURA */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${gastosCubiertos ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {gastosCubiertos ? '🚀 ¡Logro Alcanzado: Gastos Fijos Cubiertos!' : '⚡ En Camino al Punto de Equilibrio'}
              </h2>
              <p className="text-xs text-slate-400">
                {gastosCubiertos 
                  ? 'El margen bruto de tus ventas ya superó el total de tus obligaciones fijas del mes.'
                  : `Te faltan $${Math.max(0, gastosFijos - margenBruto).toLocaleString()} en margen bruto para cubrir los gastos fijos.`}
              </p>
            </div>
          </div>
          <span className="text-xl font-black font-mono text-amber-400">
            {porcentajeGastosCubiertos.toFixed(1)}%
          </span>
        </div>

        <div className="w-full bg-slate-950 rounded-full h-3.5 border border-slate-800 overflow-hidden p-0.5">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${gastosCubiertos ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-amber-500'}`}
            style={{ width: `${porcentajeGastosCubiertos}%` }}
          ></div>
        </div>
      </div>

      {/* TARJETAS DE INDICADORES FINANCIEROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Facturación Total</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-slate-100">${facturacionTotal.toLocaleString()}</h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ventas
            </span>
          </div>
          <p className="text-xs text-slate-500">Suma total de pedidos activos.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Gastos Variables (Costos)</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-rose-400">${costoTotalVendido.toLocaleString()}</h3>
          </div>
          <p className="text-xs text-slate-500">Costo real de mercadería vendida.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Margen Bruto</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-emerald-400">${margenBruto.toLocaleString()}</h3>
          </div>
          <p className="text-xs text-slate-500">Ganancia antes de gastos fijos.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Utilidad Neta Estimada</span>
          <div className="flex items-baseline justify-between">
            <h3 className={`text-2xl font-black ${utilidadNeta >= 0 ? 'text-amber-400' : 'text-rose-500'}`}>
              ${utilidadNeta.toLocaleString()}
            </h3>
          </div>
          <p className="text-xs text-slate-500">Margen Bruto menos Gastos Fijos.</p>
        </div>
      </div>

      {/* SECCIÓN DE PREVISIBILIDAD Y SUGERENCIAS DE COMPRAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Previsibilidad y Sugerencias de Reposición (Stock Crítico)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Productos con stock por debajo del mínimo sugerido que requieren compra inmediata a proveedores.
            </p>
          </div>
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
            {productosCriticos.length} Alertas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Código / Producto</th>
                <th className="px-6 py-4 text-center">Stock Actual</th>
                <th className="px-6 py-4 text-center">Stock Mínimo</th>
                <th className="px-6 py-4">Proveedor Habitual</th>
                <th className="px-6 py-4 text-right">Sugerencia de Compra</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {productosCriticos.length > 0 ? (
                productosCriticos.map((prod) => {
                  const deficit = Math.max(0, (prod.stockMinimo * 2) - prod.stockActual);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-100">
                        <span className="text-xs text-amber-400 font-mono block">{prod.codigo}</span>
                        {prod.nombre}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-rose-400">
                        {prod.stockActual}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-400">
                        {prod.stockMinimo}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {prod.proveedorPredeterminado || 'No asignado'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-amber-400">
                        Comprar +{deficit} u.
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <PackageCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    ¡Excelente! No hay productos en nivel crítico. Todo el stock está cubierto.
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

export default function FinanzasPage() {
  return (
    <ProveedoresProvider>
      <FinanzasContent />
    </ProveedoresProvider>
  );
}