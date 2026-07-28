'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, FileText, CheckCircle, Clock } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';

export default function ComprasYSolpesPage() {
  const [montado, setMontado] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const { productos } = useInventario();

  useEffect(() => {
    setMontado(true);
  }, []);

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
            <span className="text-sm font-medium">SOLPES Pendientes</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Órdenes a Proveedores</span>
            <FileText className="w-5 h-5 text-sky-400" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-sm font-medium">Recibidas este mes</span>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">0</div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl p-8 text-center text-slate-400 space-y-3">
        <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-200">No hay órdenes de compra registradas</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Desde este módulo podrás generar y realizar el seguimiento de tus pedidos a corralones y fábricas mayoristas.
        </p>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Generar Orden de Compra</h3>
            <p className="text-sm text-slate-400">Seleccioná un proveedor y los materiales a solicitar.</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}