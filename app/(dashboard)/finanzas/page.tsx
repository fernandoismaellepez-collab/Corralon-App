'use client';

import React, { useState, useEffect } from 'react';
import { useInventario } from '@/context/InventarioContext';
import { ProveedoresProvider, useProveedores } from '@/context/ProveedoresContext';
import { 
  TrendingUp, 
  AlertTriangle, 
  Award, 
  ArrowUpRight,
  PackageCheck,
  Calculator,
  PlusCircle,
  Trash2,
  Receipt,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIksicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

function FinanzasContent() {
  const { productos, pedidos, gastosFijos, setGastosFijos } = useInventario();
  const { proveedores } = useProveedores();
  
  const [mounted, setMounted] = useState(false);
  const [editandoGastos, setEditandoGastos] = useState(false);
  
  const [gastosFijosBase, setGastosFijosBase] = useState<number>(() => {
    return Number(gastosFijos) > 5000000 ? Number(gastosFijos) : 8150000;
  });
  const [tempGastosFijos, setTempGastosFijos] = useState(gastosFijosBase);

  // Estados
  const [gastosOperativos, setGastosOperativos] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const guardados = localStorage.getItem('zeta_gastos_operativos');
      return guardados ? JSON.parse(guardados) : [];
    }
    return [];
  });

  const [adelantosFijos, setAdelantosFijos] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const guardados = localStorage.getItem('zeta_adelantos_fijos');
      return guardados ? JSON.parse(guardados) : [];
    }
    return [];
  });

  const [movimientosCaja, setMovimientosCaja] = useState<any[]>([]);

  const [seccionRegistro, setSeccionRegistro] = useState<'operativo' | 'fijo'>('operativo');

  // Formulario Operativo / Restock
  const [tipoGastoOp, setTipoGastoOp] = useState<'operativo' | 'restock'>('operativo');
  const [categoriaOp, setCategoriaOp] = useState('Gasoil / Combustible');
  const [montoOp, setMontoOp] = useState<number>(0);
  const [descOp, setDescOp] = useState('');

  // Formulario Pagos / Adelantos Fijos
  const [categoriaFijo, setCategoriaFijo] = useState('Pago Alquiler del Mes');
  const [montoFijo, setMontoFijo] = useState<number>(0);
  const [descFijo, setDescFijo] = useState('');

  useEffect(() => {
    setMounted(true);
    cargarMovimientosCajaDiaria();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zeta_gastos_operativos', JSON.stringify(gastosOperativos));
    }
  }, [gastosOperativos]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zeta_adelantos_fijos', JSON.stringify(adelantosFijos));
    }
  }, [adelantosFijos]);

  const cargarMovimientosCajaDiaria = async () => {
    try {
      // 1. Consultar directamente la tabla de movimientos o app_data en Supabase
      const { data: cajaRows, error: errCaja } = await supabase
        .from('caja_movimientos')
        .select('*');

      if (!errCaja && cajaRows && cajaRows.length > 0) {
        const egresosSupabase = cajaRows.filter((m: any) => 
          m.tipo?.toLowerCase() === 'egreso' || Number(m.monto) < 0
        );
        if (egresosSupabase.length > 0) {
          setMovimientosCaja(egresosSupabase);
          return;
        }
      }

      // 2. Intentar desde app_data por si se guardan ahí
      const { data: appData } = await supabase
        .from('app_data')
        .select('id, payload');

      if (appData) {
        let extraidos: any[] = [];
        appData.forEach(row => {
          if (Array.isArray(row.payload)) {
            const matches = row.payload.filter((m: any) => 
              m.tipo?.toLowerCase() === 'egreso' || row.id?.toLowerCase().includes('caja')
            );
            extraidos = [...extraidos, ...matches];
          }
        });
        if (extraidos.length > 0) {
          setMovimientosCaja(extraidos);
          return;
        }
      }

      // 3. Fallback a localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        let encontrados: any[] = [];
        keys.forEach(k => {
          if (k.toLowerCase().includes('caja') || k.toLowerCase().includes('movimiento')) {
            try {
              const parsed = JSON.parse(localStorage.getItem(k) || '[]');
              if (Array.isArray(parsed)) {
                const egresos = parsed.filter((m: any) => m.tipo?.toLowerCase() === 'egreso' || Number(m.monto) < 0);
                encontrados = [...encontrados, ...egresos];
              }
            } catch (e) {}
          }
        });
        if (encontrados.length > 0) {
          setMovimientosCaja(encontrados);
        }
      }
    } catch (err) {
      console.error('Error al cargar caja diaria:', err);
    }
  };

  const registrarGastoOperativo = (e: React.FormEvent) => {
    e.preventDefault();
    if (montoOp <= 0 || !descOp.trim()) {
      alert('Por favor, completa el monto y la descripción.');
      return;
    }

    const nuevoGasto = {
      id: Date.now().toString(),
      tipo: tipoGastoOp,
      categoria: categoriaOp,
      monto: Number(montoOp),
      descripcion: descOp.trim(),
      creado_en: new Date().toISOString()
    };

    setGastosOperativos([nuevoGasto, ...gastosOperativos]);
    setMontoOp(0);
    setDescOp('');
    alert('¡Gasto operativo registrado con éxito!');
  };

  const registrarAdelantoFijo = (e: React.FormEvent) => {
    e.preventDefault();
    if (montoFijo <= 0 || !descFijo.trim()) {
      alert('Por favor, completa el monto y el detalle.');
      return;
    }

    const nuevoPagoFijo = {
      id: Date.now().toString(),
      tipo: 'pago_fijo',
      categoria: categoriaFijo,
      monto: Number(montoFijo),
      descripcion: descFijo.trim(),
      creado_en: new Date().toISOString()
    };

    setAdelantosFijos([nuevoPagoFijo, ...adelantosFijos]);
    setMontoFijo(0);
    setDescFijo('');
    alert('¡Pago / Adelanto fijo registrado con éxito!');
  };

  const eliminarRegistro = (id: string, esFijo: boolean) => {
    if (!confirm('¿Estás seguro de eliminar este registro?')) return;
    if (esFijo) {
      setAdelantosFijos(adelantosFijos.filter(a => a.id !== id));
    } else {
      setGastosOperativos(gastosOperativos.filter(g => g.id !== id));
    }
  };

  // Función para exportar todo el histórico (operativos, fijos y caja diaria) a Excel (CSV)
  const exportarExcelHistorico = () => {
    const filasCSV = [
      ['Tipo', 'Categoría', 'Descripción', 'Monto', 'Fecha']
    ];

    adelantosFijos.forEach(a => {
      filasCSV.push(['Adelanto/Pago Fijo', a.categoria, a.descripcion, a.monto, new Date(a.creado_en).toLocaleDateString()]);
    });

    gastosOperativos.forEach(g => {
      filasCSV.push([g.tipo === 'restock' ? 'Re-stock' : 'Gasto Operativo', g.categoria, g.descripcion, g.monto, new Date(g.creado_en).toLocaleDateString()]);
    });

    movimientosCaja.forEach(m => {
      filasCSV.push(['Egreso Caja Diaria', m.categoria || m.medio_pago || 'Caja', m.descripcion || m.concepto, Math.abs(Number(m.monto || 0)), new Date(m.creado_en || m.fecha || Date.now()).toLocaleDateString()]);
    });

    const contenidoCSV = filasCSV.map(e => e.join(';')).join('\n');
    const blob = new Blob(['\ufeff' + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_financiero_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!mounted) {
    return null;
  }

  const mesAnioActual = new Date().toISOString().slice(0, 7);

  // 1. Facturación Total
  const ventasValidas = pedidos.filter((p: any) => p.estado !== 'Cancelado');
  const facturacionTotal = ventasValidas.reduce((acc: number, p: any) => acc + Number(p.total || 0), 0);

  // 2. Costos Variables / Mercadería Vendida
  let costoTotalVendido = 0;
  ventasValidas.forEach((pedido: any) => {
    if (pedido.items && Array.isArray(pedido.items)) {
      pedido.items.forEach((item: any) => {
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
          costoUnitario = (item.precioUnitario || 0) * 0.7;
        }
        costoTotalVendido += costoUnitario * (item.cantidad || 0);
      });
    }
  });

  const totalRestockOperativo = gastosOperativos
    .filter(g => g.tipo === 'restock')
    .reduce((acc, g) => acc + Number(g.monto || 0), 0);

  const costoVariablesTotales = costoTotalVendido + totalRestockOperativo;

  // 3. Gastos Operativos Diarios (manuales + caja diaria)
  const manualOpTotal = gastosOperativos
    .filter(g => g.tipo === 'operativo')
    .reduce((acc, g) => acc + Number(g.monto || 0), 0);

  const cajaOpTotal = movimientosCaja
    .reduce((acc, m) => acc + Math.abs(Number(m.monto || 0)), 0);

  const totalGastosOperativosDiarios = manualOpTotal + cajaOpTotal;

  // 4. Filtrar adelantos estrictamente del MES EN CURSO (se reinician cada 1 de mes)
  const adelantosMesActual = adelantosFijos.filter(a => {
    const fechaA = new Date(a.creado_en || Date.now()).toISOString().slice(0, 7);
    return fechaA === mesAnioActual;
  });

  const totalAdelantosMes = adelantosMesActual.reduce((acc, a) => acc + Number(a.monto || 0), 0);
  const gastosFijosNetos = Math.max(0, Number(gastosFijosBase) - totalAdelantosMes);

  // 5. Márgenes y Utilidad
  const margenBruto = facturacionTotal - costoVariablesTotales;
  const egresosTotalesMes = gastosFijosNetos + totalGastosOperativosDiarios;
  const utilidadNeta = margenBruto - egresosTotalesMes;
  
  const porcentajeGastosCubiertos = egresosTotalesMes > 0 ? Math.min(100, (margenBruto / egresosTotalesMes) * 100) : 100;
  const gastosCubiertos = margenBruto >= egresosTotalesMes;

  const productosCriticos = productos.filter((p: any) => Number(p.stockActual) <= Number(p.stockMinimo));

  const guardarGastosFijos = (e: React.FormEvent) => {
    e.preventDefault();
    setGastosFijosBase(Number(tempGastosFijos));
    setGastosFijos(Number(tempGastosFijos));
    setEditandoGastos(false);
  };

  return (
    <div className="space-y-8 pb-12 text-slate-100 p-6 sm:p-10 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3 text-white">
            <TrendingUp className="w-8 h-8 text-amber-500" />
            Finanzas, Operatividad y Previsibilidad
          </h1>
          <p className="text-slate-400 mt-1 text-xs sm:text-sm">
            Control de gastos operativos, caja diaria, pagos fijos mensuales del 1 al 10 y reposición.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportarExcelHistorico}
            className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer shadow-lg"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Exportar Histórico (Excel)
          </button>

          <button
            onClick={() => setEditandoGastos(!editandoGastos)}
            className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-200 flex items-center gap-2 transition cursor-pointer shadow-lg"
          >
            <Calculator className="w-4 h-4 text-amber-500" />
            Fijos Base (${Number(gastosFijosBase).toLocaleString()})
          </button>
        </div>
      </div>

      {editandoGastos && (
        <form onSubmit={guardarGastosFijos} className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl shadow-xl max-w-md space-y-4">
          <h3 className="text-md font-bold text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" /> Actualizar Gastos Fijos Base Mensuales
          </h3>
          <p className="text-xs text-slate-400">Suma total de alquileres, sueldos base e internet antes de adelantos.</p>
          <input
            type="number"
            value={tempGastosFijos}
            onChange={(e) => setTempGastosFijos(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
            required
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditandoGastos(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs cursor-pointer"
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
                {gastosCubiertos ? '🚀 ¡Punto de Equilibrio Superado!' : '⚡ En Camino al Punto de Equilibrio'}
              </h2>
              <p className="text-xs text-slate-400">
                {gastosCubiertos 
                  ? 'El margen bruto cubre holgadamente los gastos fijos netos del mes y la operatividad.'
                  : `Te faltan $${Math.max(0, egresosTotalesMes - margenBruto).toLocaleString()} en margen bruto para cubrir todos los egresos.`}
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
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Facturación Total</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-white">${facturacionTotal.toLocaleString()}</h3>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> Ventas
            </span>
          </div>
          <p className="text-[10px] text-slate-500">Suma total de pedidos activos.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Costos Variables / Mercadería</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-rose-400">${costoVariablesTotales.toLocaleString()}</h3>
          </div>
          <p className="text-[10px] text-slate-500">CMV + Restock de proveedores.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fijos Netos (Mes) + Op. Diarios</span>
          <div className="flex items-baseline justify-between">
            <h3 className="text-2xl font-black text-amber-400">${egresosTotalesMes.toLocaleString()}</h3>
          </div>
          <p className="text-[10px] text-slate-500">Fijos Netos (${gastosFijosNetos.toLocaleString()}) + Op. ($ {totalGastosOperativosDiarios.toLocaleString()}).</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Utilidad Neta Estimada</span>
          <div className="flex items-baseline justify-between">
            <h3 className={`text-2xl font-black ${utilidadNeta >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
              ${utilidadNeta.toLocaleString()}
            </h3>
          </div>
          <p className="text-[10px] text-slate-500">Margen bruto menos todos los egresos.</p>
        </div>
      </div>

      {/* ÁREAS DE REGISTRO SEPARADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Formulario de Registro */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setSeccionRegistro('operativo')}
              className={`flex-1 pb-1 text-xs font-bold uppercase transition-colors cursor-pointer ${seccionRegistro === 'operativo' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
            >
              1. Gastos Operativos
            </button>
            <button
              onClick={() => setSeccionRegistro('fijo')}
              className={`flex-1 pb-1 text-xs font-bold uppercase transition-colors cursor-pointer ${seccionRegistro === 'fijo' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-slate-400 hover:text-white'}`}
            >
              2. Pagos / Adelantos Fijos
            </button>
          </div>

          {seccionRegistro === 'operativo' ? (
            <form onSubmit={registrarGastoOperativo} className="space-y-3 pt-2">
              <p className="text-[11px] text-slate-400">Control de operatividad (gasoil, aceite, librería) y compras de stock.</p>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button" 
                  onClick={() => setTipoGastoOp('operativo')} 
                  className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${tipoGastoOp === 'operativo' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                >
                  Gasto Operativo
                </button>
                <button 
                  type="button" 
                  onClick={() => setTipoGastoOp('restock')} 
                  className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${tipoGastoOp === 'restock' ? 'bg-sky-500 text-slate-950 border-sky-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}
                >
                  Compra / Re-stock
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Categoría</label>
                <select
                  value={categoriaOp}
                  onChange={(e) => setCategoriaOp(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Gasoil / Combustible">Gasoil / Combustible</option>
                  <option value="Aceite / Lubricantes">Aceite / Lubricantes</option>
                  <option value="Librería / Insumos">Librería / Insumos</option>
                  <option value="Mantenimiento / Reparaciones">Mantenimiento / Reparaciones</option>
                  <option value="Re-stock Mercadería">Re-stock Mercadería</option>
                  <option value="Varios / Otros">Varios / Otros</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    value={montoOp || ''}
                    onChange={(e) => setMontoOp(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Detalle</label>
                  <input
                    type="text"
                    value={descOp}
                    onChange={(e) => setDescOp(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Ej. Carga YPF"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <PlusCircle className="w-4 h-4" /> Registrar Gasto Operativo
              </button>
            </form>
          ) : (
            <form onSubmit={registrarAdelantoFijo} className="space-y-3 pt-2">
              <p className="text-[11px] text-slate-400">Registra pagos del 1 al 10 (alquileres, adelantos de sueldo) que descuentan automáticamente del fijo base de este mes.</p>
              
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Concepto / Categoría</label>
                <select
                  value={categoriaFijo}
                  onChange={(e) => setCategoriaFijo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="Pago Alquiler del Mes">Pago Alquiler del Mes</option>
                  <option value="Adelanto de Sueldo">Adelanto de Sueldo</option>
                  <option value="Pago anticipado Servicio Fijo">Pago anticipado Servicio Fijo</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    value={montoFijo || ''}
                    onChange={(e) => setMontoFijo(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Detalle / Empleado</label>
                  <input
                    type="text"
                    value={descFijo}
                    onChange={(e) => setDescFijo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                    placeholder="Ej. Alquiler local"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-extrabold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
              >
                <PlusCircle className="w-4 h-4" /> Registrar Pago / Adelanto Fijo
              </button>
            </form>
          )}
        </div>

        {/* Historiales */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-500" /> Historial de Egresos y Adelantos Fijos
            </h2>
            <span className="text-[10px] font-mono text-amber-400">Fijos Base: ${Number(gastosFijosBase).toLocaleString()} \vert{} Adelantos Mes: -${totalAdelantosMes.toLocaleString()}</span>
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
            {/* Listado de Pagos / Adelantos Fijos */}
            {adelantosFijos.map((a, idx) => (
              <div key={`adelanto-${idx}`} className="bg-amber-950/20 border border-amber-500/30 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-400">
                      {a.categoria} (Descuenta Fijo)
                    </span>
                    <span className="text-slate-400 text-[10px]">{new Date(a.creado_en).toLocaleDateString()}</span>
                  </div>
                  <span className="text-white font-medium block mt-0.5">{a.descripcion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-amber-400 text-sm">
                    -${Number(a.monto).toLocaleString('es-AR')}
                  </span>
                  <button
                    onClick={() => eliminarRegistro(a.id, true)}
                    className="text-rose-400 hover:text-rose-300 transition-colors p-1 cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Listado de Gastos Operativos Manuales */}
            {gastosOperativos.map((g, idx) => (
              <div key={`op-${idx}`} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${g.tipo === 'restock' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-300'}`}>
                      {g.categoria}
                    </span>
                    <span className="text-slate-400 text-[10px]">{new Date(g.creado_en).toLocaleDateString()}</span>
                  </div>
                  <span className="text-white font-medium block mt-0.5">{g.descripcion}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    -${Number(g.monto).toLocaleString('es-AR')}
                  </span>
                  <button
                    onClick={() => eliminarRegistro(g.id, false)}
                    className="text-rose-400 hover:text-rose-300 transition-colors p-1 cursor-pointer"
                    title="Eliminar gasto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Listado Automático de Caja Diaria (Egresos) */}
            {movimientosCaja.map((m, idx) => (
              <div key={`caja-${idx}`} className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-500/20 text-emerald-400">
                      Caja Diaria ({m.categoria || m.medio_pago || 'General'})
                    </span>
                    <span className="text-slate-400 text-[10px]">{new Date(m.creado_en || m.fecha || Date.now()).toLocaleDateString()}</span>
                  </div>
                  <span className="text-slate-300 font-medium block mt-0.5">{m.descripcion || m.concepto || 'Egreso de caja'}</span>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    -${Math.abs(Number(m.monto || 0)).toLocaleString('es-AR')}
                  </span>
                  <span className="block text-[9px] text-slate-500">Automático</span>
                </div>
              </div>
            ))}

            {gastosOperativos.length === 0 && adelantosFijos.length === 0 && movimientosCaja.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-xs">
                No hay egresos operativos ni adelantos registrados.
              </div>
            )}
          </div>
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
                productosCriticos.map((prod: any) => {
                  const deficit = Math.max(0, (prod.stockMinimo * 2) - prod.stockActual);
                  return (
                    <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-100">
                        <span className="text-xs text-amber-400 font-mono block">{prod.codigo}</span>
                        {prod.name || prod.nombre}
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