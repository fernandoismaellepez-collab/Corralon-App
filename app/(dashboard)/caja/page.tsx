'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Lock, Unlock, PlusCircle, CheckCircle, AlertCircle, RefreshCw, Calculator, ShieldCheck, ShoppingCart } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CajaPage() {
  const [turnoActual, setTurnoActual] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [ventasPedidos, setVentasPedidos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estado para filtrar las ventas automáticas visualmente
  const [filtroVentas, setFiltroVentas] = useState<'todos' | 'efectivo' | 'transferencia'>('todos');

  // Estados para apertura
  const [operador, setOperador] = useState('Operador Corralón');
  const [montoInicial, setMontoInicial] = useState<number>(10000);
  
  // Estados para movimiento manual (gasto/ingreso extra)
  const [tipoMov, setTipoMov] = useState<'ingreso' | 'egreso'>('egreso');
  const [medioPagoMov, setMedioPagoMov] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [montoMov, setMontoMov] = useState<number>(0);
  const [descMov, setDescMov] = useState('');

  // Estado para cierre (Arqueo)
  const [montoDeclarado, setMontoDeclarado] = useState<number>(0);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);

  useEffect(() => {
    verificarTurnoActivo();
  }, []);

  const verificarTurnoActivo = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from('caja_turnos')
        .select('*')
        .eq('estado', 'abierta')
        .order('fecha_apertura', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        const turno = data[0];
        setTurnoActual(turno);
        await cargarMovimientosYVentas(turno.id, turno.fecha_apertura);
      } else {
        setTurnoActual(null);
        setMovimientos([]);
        setVentasPedidos([]);
      }
    } catch (err) {
      console.error('Error al verificar turno:', err);
    } finally {
      setCargando(false);
    }
  };

  const cargarMovimientosYVentas = async (turnoId: string, fechaAperturaTurno: string) => {
    try {
      // 1. Cargar movimientos manuales de la tabla caja_movimientos
      const { data: movData } = await supabase
        .from('caja_movimientos')
        .select('*')
        .eq('turno_id', turnoId)
        .order('creado_en', { ascending: false });

      if (movData) setMovimientos(movData);

      // 2. Cargar ventas automáticas desde la estructura JSON de app_data (id = 'pedidos')
      const { data: appData, error: appError } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'pedidos')
        .single();

      if (!appError && appData?.payload) {
        const todosLosPedidos = appData.payload || [];
        const fechaInicioTurno = new Date(fechaAperturaTurno).getTime();

        // Filtramos pedidos generados a partir de la apertura de caja
        const ventasDelTurno = todosLosPedidos.filter((p: any) => {
          const fechaPedido = new Date(p.fecha || p.creado_en || Date.now()).getTime();
          return fechaPedido >= fechaInicioTurno;
        });

        setVentasPedidos(ventasDelTurno);
      }
    } catch (err) {
      console.error('Error al cargar datos automáticos de ventas:', err);
    }
  };

  const abrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase
        .from('caja_turnos')
        .insert([
          {
            operador: operador || 'Operador',
            monto_inicial: Number(montoInicial),
            total_efectivo_sistema: 0,
            total_transferencia_sistema: 0,
            estado: 'abierta'
          }
        ])
        .select();

      if (error) throw error;
      if (data && data.length > 0) {
        setTurnoActual(data[0]);
        await cargarMovimientosYVentas(data[0].id, data[0].fecha_apertura);
      }
    } catch (err: any) {
      alert('Error al abrir la caja: ' + err.message);
    }
  };

  const registrarMovimientoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoActual || montoMov <= 0 || !descMov.trim()) {
      alert('Por favor, completa todos los datos del movimiento.');
      return;
    }

    try {
      const { error } = await supabase.from('caja_movimientos').insert([
        {
          turno_id: turnoActual.id,
          tipo: tipoMov,
          medio_pago: medioPagoMov,
          monto: Number(montoMov),
          descripcion: descMov.trim()
        }
      ]);

      if (error) throw error;

      setMontoMov(0);
      setDescMov('');
      await cargarMovimientosYVentas(turnoActual.id, turnoActual.fecha_apertura);
    } catch (err: any) {
      alert('Error al registrar movimiento: ' + err.message);
    }
  };

  // --- CÁLCULOS AUTOMÁTICOS ROBUSTOS PARA CLASIFICAR MEDIO DE PAGO ---
  const clasificarMedioPago = (p: any) => {
    const textoPago = [
      p.medioPago,
      p.metodoPago,
      p.pago,
      p.formaPago,
      p.tipoPago,
      p.observaciones,
      p.obs
    ].filter(Boolean).join(' ').toLowerCase();

    if (
      textoPago.includes('transferencia') || 
      textoPago.includes('transf') || 
      textoPago.includes('banco') || 
      textoPago.includes('mp') || 
      textoPago.includes('mercado pago') ||
      textoPago.includes('tarjeta')
    ) {
      return 'transferencia';
    }
    
    return 'efectivo';
  };

  // 1. Total Efectivo por Ventas de Pedidos
  const totalEfectivoPedidos = ventasPedidos.reduce((acc, p) => {
    return clasificarMedioPago(p) === 'efectivo' ? acc + Number(p.total || 0) : acc;
  }, 0);

  // 2. Total Transferencia por Ventas de Pedidos
  const totalTransferenciaPedidos = ventasPedidos.reduce((acc, p) => {
    return clasificarMedioPago(p) === 'transferencia' ? acc + Number(p.total || 0) : acc;
  }, 0);

  // 3. Movimientos manuales en Efectivo
  const totalEfectivoMovimientos = movimientos.reduce((acc, m) => {
    if (m.medio_pago === 'efectivo') {
      return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto);
    }
    return acc;
  }, 0);

  // 4. Movimientos manuales en Transferencia
  const totalTransferenciaMovimientos = movimientos.reduce((acc, m) => {
    if (m.medio_pago === 'transferencia') {
      return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto);
    }
    return acc;
  }, 0);

  // Totales finales unificados
  const efectivoEsperadoEnCaja = Number(turnoActual?.monto_inicial || 0) + totalEfectivoPedidos + totalEfectivoMovimientos;
  const totalTransferenciasGeneral = totalTransferenciaPedidos + totalTransferenciaMovimientos;

  // Lista de ventas filtrada según selección del usuario
  const ventasFiltradas = ventasPedidos.filter(p => {
    const tipo = clasificarMedioPago(p);
    if (filtroVentas === 'efectivo') return tipo === 'efectivo';
    if (filtroVentas === 'transferencia') return tipo === 'transferencia';
    return true; // 'todos'
  });

  const realizarCierreCaja = async () => {
    if (!turnoActual) return;

    const diferencia = Number(montoDeclarado) - efectivoEsperadoEnCaja;

    try {
      const { error } = await supabase
        .from('caja_turnos')
        .update({
          total_efectivo_sistema: efectivoEsperadoEnCaja,
          total_transferencia_sistema: totalTransferenciasGeneral,
          monto_declarado_cierre: Number(montoDeclarado),
          diferencia: diferencia,
          estado: 'cerrada',
          fecha_cierre: new Date().toISOString()
        })
        .eq('id', turnoActual.id);

      if (error) throw error;

      alert(`¡Caja cerrada con éxito! Diferencia registrada: $${diferencia.toLocaleString('es-AR')}`);
      setModalCierreAbierto(false);
      setTurnoActual(null);
      setMovimientos([]);
      setVentasPedidos([]);
    } catch (err: any) {
      alert('Error al cerrar caja: ' + err.message);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4" /> Control Financiero
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Caja Diaria y Auditoría</h1>
          </div>
          <button
            onClick={verificarTurnoActivo}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Ventas y Caja
          </button>
        </div>

        {!turnoActual ? (
          /* PANTALLA DE APERTURA */
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg mx-auto shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">No hay ninguna caja abierta</h2>
              <p className="text-xs text-slate-400">Inicia un nuevo turno configurando el operador y el fondo inicial de efectivo.</p>
            </div>

            <form onSubmit={abrirCaja} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Operador a Cargo</label>
                <input
                  type="text"
                  value={operador}
                  onChange={(e) => setOperador(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Fondo Fijo / Saldo Inicial en Efectivo ($)</label>
                <input
                  type="number"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-amber-400 font-mono font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Abrir Caja y Comenzar Turno
              </button>
            </form>
          </div>
        ) : (
          /* PANEL DE CAJA ABIERTA */
          <div className="space-y-8">
            
            {/* Tarjetas de Resumen en Tiempo Real */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Fondo Inicial</span>
                <span className="block text-xl font-mono font-bold text-white">${Number(turnoActual.monto_inicial).toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500">Operador: {turnoActual.operador}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Efectivo en Caja</span>
                <span className="block text-xl font-mono font-bold text-emerald-400">${efectivoEsperadoEnCaja.toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500">Ventas efectivo + fondo + mov.</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-sky-400 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Transferencias</span>
                <span className="block text-xl font-mono font-bold text-sky-400">${totalTransferenciasGeneral.toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500">Ventas transferencia + mov.</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase block mb-1">Auditoría y Cierre</span>
                  <span className="text-[11px] text-slate-300 block mb-3">Arqueo diario final</span>
                </div>
                <button
                  onClick={() => {
                    setMontoDeclarado(efectivoEsperadoEnCaja);
                    setModalCierreAbierto(true);
                  }}
                  className="w-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" /> Realizar Arqueo y Cerrar
                </button>
              </div>
            </div>

            {/* Dos Columnas: Ventas Automáticas de Pedidos + Movimientos Manuales */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Columna Izquierda: Ventas Automáticas desde Pedidos con Filtro */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Ventas Automáticas ({ventasPedidos.length})
                  </h2>

                  {/* Botones de Filtro por Medio de Pago */}
                  <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[10px]">
                    <button
                      onClick={() => setFiltroVentas('todos')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${filtroVentas === 'todos' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Todos
                    </button>
                    <button
                      onClick={() => setFiltroVentas('efectivo')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${filtroVentas === 'efectivo' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Efectivo
                    </button>
                    <button
                      onClick={() => setFiltroVentas('transferencia')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${filtroVentas === 'transferencia' ? 'bg-sky-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                    >
                      Transferencia
                    </button>
                  </div>
                </div>

                <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1">
                  {ventasFiltradas.length > 0 ? (
                    ventasFiltradas.map((p, idx) => {
                      const medioDetectado = clasificarMedioPago(p);
                      return (
                        <div key={idx} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-xs font-medium text-white block">{p.nombreCliente || 'Cliente General'}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-mono bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded uppercase font-bold">{p.id || 'PEDIDO'}</span>
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${medioDetectado === 'efectivo' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'}`}>
                                {medioDetectado}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block text-xs font-mono font-bold text-emerald-400">+${Number(p.total || 0).toLocaleString('es-AR')}</span>
                            <span className="text-[9px] text-slate-500">{new Date(p.fecha || p.creado_en || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      No hay ventas registrados bajo este filtro en este turno.
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Registrar Movimiento Manual y Listado */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
                <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" /> Registrar Gasto o Ingreso Extra
                </h2>

                <form onSubmit={registrarMovimientoManual} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setTipoMov('egreso')} className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${tipoMov === 'egreso' ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                      Egreso / Gasto (-)
                    </button>
                    <button type="button" onClick={() => setTipoMov('ingreso')} className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${tipoMov === 'ingreso' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`} >
                      Ingreso Extra (+)
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setMedioPagoMov('efectivo')} className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${medioPagoMov === 'efectivo' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                      Efectivo
                    </button>
                    <button type="button" onClick={() => setMedioPagoMov('transferencia')} className={`p-2 rounded-xl text-xs font-bold border cursor-pointer ${medioPagoMov === 'transferencia' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                      Transferencia
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={montoMov || ''} onChange={(e) => setMontoMov(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" placeholder="Monto ($)" required />
                    <input type="text" value={descMov} onChange={(e) => setDescMov(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" placeholder="Concepto (ej. Flete)" required />
                  </div>

                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" /> Registrar en Caja
                  </button>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Movimientos Manuales Registrados</span>
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                    {movimientos.map((m, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white font-medium">{m.descripcion}</span>
                          <span className="block text-[9px] text-slate-400 capitalize">{m.medio_pago} • {m.tipo}</span>
                        </div>
                        <span className={`font-mono font-bold ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {m.tipo === 'ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MODAL DE ARQUEO Y CIERRE */}
        {modalCierreAbierto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" /> Auditoría Diaria y Cierre
                </h3>
                <p className="text-xs text-slate-400">
                  El sistema consolidó automáticamente las ventas y movimientos en efectivo y transferencias. Ingresa el efectivo real contado en gaveta.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Efectivo Esperado (Sistema):</span>
                  <span className="font-mono font-bold text-emerald-400">${efectivoEsperadoEnCaja.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Transferencias Totales:</span>
                  <span className="font-mono font-bold text-sky-400">${totalTransferenciasGeneral.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Efectivo Real Contado en Gaveta ($)</label>
                <input
                  type="number"
                  value={montoDeclarado}
                  onChange={(e) => setMontoDeclarado(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-amber-400 font-mono font-bold"
                />
                {montoDeclarado !== efectivoEsperadoEnCaja && (
                  <p className={`text-[11px] font-mono ${montoDeclarado > efectivoEsperadoEnCaja ? 'text-emerald-400' : 'text-rose-400'}`}>
                    Diferencia de Arqueo: ${(montoDeclarado - efectivoEsperadoEnCaja).toLocaleString('es-AR')}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalCierreAbierto(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="button" onClick={realizarCierreCaja} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer shadow-lg">
                  Confirmar Cierre y Auditoría
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}