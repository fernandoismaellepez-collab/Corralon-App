'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Lock, Unlock, PlusCircle, CheckCircle, AlertCircle, RefreshCw, Calculator, ShieldCheck, ShoppingCart, Download, Trash2, History, Calendar, Check, AlertTriangle, Users } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CajaPage() {
  const [turnoActual, setTurnoActual] = useState<any>(null);
  const [ultimoTurnoCerrado, setUltimoTurnoCerrado] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [ventasPedidos, setVentasPedidos] = useState<any[]>([]);
  const [cobrosRealizados, setCobrosRealizados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [operador, setOperador] = useState('Operador Corralón');
  const [montoInicial, setMontoInicial] = useState<number>(0);
  const [saldoTransferenciaInicial, setSaldoTransferenciaInicial] = useState<number>(0);
  
  const [tipoMov, setTipoMov] = useState<'ingreso' | 'egreso'>('egreso');
  const [medioPagoMov, setMedioPagoMov] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [montoMov, setMontoMov] = useState<number>(0);
  const [descMov, setDescMov] = useState('');

  const [montoDeclarado, setMontoDeclarado] = useState<number>(0);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const [modalCCAbierto, setModalCCAbierto] = useState(false);

  useEffect(() => {
    verificarTurnoActivo();
  }, []);

  const verificarTurnoActivo = async () => {
    setCargando(true);
    try {
      const { data: appData, error: appError } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'pedidos')
        .single();

      if (!appError && appData?.payload) {
        const todosLosPedidos = appData.payload.filter((p: any) => {
          const estado = String(p.estado || p.status || '').trim().toLowerCase();
          return estado !== 'cancelado';
        });
        setVentasPedidos(todosLosPedidos);
      }

      const { data: appTurnos } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'caja_turnos_estado')
        .single();

      const turnosData = appTurnos?.payload || { turnoAbierto: null, ultimoCierre: null };
      setTurnoActual(turnosData.turnoAbierto || null);
      setUltimoTurnoCerrado(turnosData.ultimoCierre || null);

      if (turnosData.turnoAbierto?.saldo_transferencia_inicial !== undefined) {
        setSaldoTransferenciaInicial(Number(turnosData.turnoAbierto.saldo_transferencia_inicial));
      } else {
        setSaldoTransferenciaInicial(0);
      }

      if (turnosData.turnoAbierto?.monto_inicial !== undefined) {
        setMontoInicial(Number(turnosData.turnoAbierto.monto_inicial));
      } else {
        setMontoInicial(0);
      }

      if (turnosData.turnoAbierto && turnosData.turnoAbierto.id) {
        const { data: appMovs } = await supabase
          .from('app_data')
          .select('payload')
          .eq('id', `caja_movimientos_${turnosData.turnoAbierto.id}`)
          .single();
        setMovimientos(appMovs?.payload || []);

        const { data: appCobros } = await supabase
          .from('app_data')
          .select('payload')
          .eq('id', `caja_cobros_${turnosData.turnoAbierto.id}`)
          .single();
        setCobrosRealizados(appCobros?.payload || []);
      } else {
        setMovimientos([]);
        setCobrosRealizados([]);
      }

    } catch (err) {
      console.error('Error al verificar turno:', err);
    } finally {
      setCargando(false);
    }
  };

  const abrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const nuevoTurno = {
        id: 'turno_' + Date.now(),
        operador: operador || 'Operador',
        monto_inicial: Number(montoInicial),
        saldo_transferencia_inicial: Number(saldoTransferenciaInicial),
        fecha_apertura: new Date().toISOString(),
        estado: 'abierta'
      };

      const { data: appTurnos } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'caja_turnos_estado')
        .single();

      const historialCierres = appTurnos?.payload?.historialCierres || [];

      await supabase
        .from('app_data')
        .upsert([{
          id: 'caja_turnos_estado',
          payload: {
            turnoAbierto: nuevoTurno,
            ultimoCierre: ultimoTurnoCerrado,
            historialCierres
          },
          updated_at: new Date().toISOString()
        }]);

      setTurnoActual(nuevoTurno);
      await verificarTurnoActivo();
    } catch (err: any) {
      alert('Error al abrir la caja: ' + err.message);
    }
  };

  const registrarMovimientoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoActual || montoMov <= 0 || !descMov.trim()) {
      alert('Por favor, completa todos los datos.');
      return;
    }

    try {
      const nuevoMov = {
        id: 'mov_' + Date.now(),
        tipo: tipoMov,
        medio_pago: medioPagoMov,
        monto: Number(montoMov),
        descripcion: descMov.trim(),
        creado_en: new Date().toISOString()
      };

      const actualizados = [nuevoMov, ...movimientos];
      
      await supabase
        .from('app_data')
        .upsert([{
          id: `caja_movimientos_${turnoActual.id}`,
          payload: actualizados,
          updated_at: new Date().toISOString()
        }]);

      setMovimientos(actualizados);
      setMontoMov(0);
      setDescMov('');
    } catch (err: any) {
      alert('Error al registrar movimiento: ' + err.message);
    }
  };

  const eliminarMovimientoManual = async (movId: string) => {
    if (!confirm('¿Estás seguro de eliminar este movimiento?')) return;
    try {
      const actualizados = movimientos.filter(m => m.id !== movId);
      
      await supabase
        .from('app_data')
        .upsert([{
          id: `caja_movimientos_${turnoActual.id}`,
          payload: actualizados,
          updated_at: new Date().toISOString()
        }]);

      setMovimientos(actualizados);
    } catch (err: any) {
      alert('Error al eliminar movimiento: ' + err.message);
    }
  };

  const eliminarCobro = async (cobroId: string) => {
    if (!confirm('¿Estás seguro de anular este cobro?')) return;
    try {
      const cobrosActualizados = cobrosRealizados.filter(c => c.id !== cobroId);
      
      await supabase
        .from('app_data')
        .upsert([{
          id: `caja_cobros_${turnoActual.id}`,
          payload: cobrosActualizados,
          updated_at: new Date().toISOString()
        }]);

      setCobrosRealizados(cobrosActualizados);
    } catch (err: any) {
      alert('Error al anular cobro: ' + err.message);
    }
  };

  // IDs de pedidos ya cobrados
  const idsPedidosCobrados = new Set(cobrosRealizados.map(c => c.pedidoId));

  const obtenerFechaPedido = (p: any) => {
    const fechaBruta = p.fecha || p.creado_en || p.createdAt || p.fecha_creacion || new Date().toISOString();
    return new Date(String(fechaBruta).slice(0, 10));
  };

  const fechaCorteCC = new Date('2026-09-19T00:00:00'); // Sábado 19/09 de corte

  // Solo consideramos pendientes reales desde el Sábado 19/09 en adelante para la CC
  const todosLosPendientes = ventasPedidos.filter(p => {
    if (idsPedidosCobrados.has(p.id || 'S/N')) return false;
    const fechaP = obtenerFechaPedido(p);
    return fechaP >= fechaCorteCC; // Ignora todo lo anterior al 19/09
  }).map(p => {
    const fechaP = obtenerFechaPedido(p);
    const hoy = new Date();
    const diferenciaDias = Math.floor((hoy.getTime() - fechaP.getTime()) / (1000 * 3600 * 24));
    return {
      ...p,
      diasPendiente: diferenciaDias,
      atrasado: diferenciaDias > 7,
      fechaObj: fechaP
    };
  }).sort((a, b) => b.diasPendiente - a.diasPendiente);

  // Agrupamiento por cliente para Cuenta Corriente (CC)
  const resumenCCPorCliente = todosLosPendientes.reduce((acc: any, p: any) => {
    const cliente = (p.nombreCliente || 'Cliente General').trim();
    if (!acc[cliente]) {
      acc[cliente] = {
        nombre: cliente,
        cantidadPedidos: 0,
        deudaTotal: 0,
        pedidos: []
      };
    }
    acc[cliente].cantidadPedidos += 1;
    acc[cliente].deudaTotal += Number(p.total || 0);
    acc[cliente].pedidos.push(p);
    return acc;
  }, {});

  const listaClientesCC = Object.values(resumenCCPorCliente).sort((a: any, b: any) => b.deudaTotal - a.deudaTotal);
  const deudaTotalCC = todosLosPendientes.reduce((acc, p) => acc + Number(p.total || 0), 0);

  // Cálculos de totales del día actual
  const totalEfectivoCobros = cobrosRealizados.filter(c => c.medioPago === 'efectivo').reduce((acc, c) => acc + Number(c.monto), 0);
  const totalTransferenciaCobros = cobrosRealizados.filter(c => c.medioPago === 'transferencia').reduce((acc, c) => acc + Number(c.monto), 0);

  const totalEfectivoMovs = movimientos.reduce((acc, m) => {
    if (m.medio_pago === 'efectivo') {
      return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto);
    }
    return acc;
  }, 0);

  const totalTransferenciaMovs = movimientos.reduce((acc, m) => {
    if (m.medio_pago === 'transferencia') {
      return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto);
    }
    return acc;
  }, 0);

  const efectivoEsperadoEnCaja = Number(turnoActual?.monto_inicial || 0) + totalEfectivoCobros + totalEfectivoMovs;
  const baseTransferenciasAnterior = Number(turnoActual?.saldo_transferencia_inicial || 0);
  const totalTransferenciasGeneral = baseTransferenciasAnterior + totalTransferenciaCobros + totalTransferenciaMovs;

  const realizarCierreCaja = async () => {
    if (!turnoActual) return;
    const diferencia = Number(montoDeclarado) - efectivoEsperadoEnCaja;

    try {
      const turnoCerrado = {
        ...turnoActual,
        total_efectivo_sistema: efectivoEsperadoEnCaja,
        total_transferencia_sistema: totalTransferenciasGeneral,
        monto_declarado_cierre: Number(montoDeclarado),
        diferencia: diferencia,
        estado: 'cerrada',
        fecha_cierre: new Date().toISOString()
      };

      await supabase
        .from('app_data')
        .upsert([{
          id: 'caja_turnos_estado',
          payload: {
            turnoAbierto: null,
            ultimoCierre: turnoCerrado
          },
          updated_at: new Date().toISOString()
        }]);

      alert(`¡Caja cerrada con éxito! Diferencia registrada: $${diferencia.toLocaleString('es-AR')}`);
      setModalCierreAbierto(false);
      setTurnoActual(null);
      setMovimientos([]);
      setCobrosRealizados([]);
      await verificarTurnoActivo();
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
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-wider mb-1">
              <Wallet className="w-4 h-4" /> Control Financiero Inteligente
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Caja Diaria y Cobros</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalCCAbierto(true)}
              className="bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors shadow-lg"
            >
              <Users className="w-4 h-4" /> Cuenta Corriente (CC): ${deudaTotalCC.toLocaleString('es-AR')}
            </button>
            <button
              onClick={verificarTurnoActivo}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
            </button>
          </div>
        </div>

        {!turnoActual ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg mx-auto shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Abrir Caja del Día / Nuevo Turno</h2>
              <p className="text-xs text-slate-400">Ingresa los saldos iniciales (puedes dejarlos en $0 para arrancar limpiamente).</p>
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
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Saldo Inicial en Efectivo ($)</label>
                <input
                  type="number"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-amber-400 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Saldo Inicial en Transferencias ($)</label>
                <input
                  type="number"
                  value={saldoTransferenciaInicial}
                  onChange={(e) => setSaldoTransferenciaInicial(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-sky-400 font-mono font-bold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Abrir Caja con $0 Iniciales
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-8">
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Fondo Inicial Actual</span>
                <span className="block text-xl font-mono font-bold text-white">${Number(turnoActual.monto_inicial).toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500">Operador: {turnoActual.operador}</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-emerald-400 uppercase flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Efectivo en Caja Hoy</span>
                <span className="block text-xl font-mono font-bold text-emerald-400">${efectivoEsperadoEnCaja.toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500">Cobros efectivo + fondo + mov.</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1">
                <span className="text-[10px] font-mono text-sky-400 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Transferencias Disponibles</span>
                <span className="block text-xl font-mono font-bold text-sky-400">${totalTransferenciasGeneral.toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500">Saldo inicial + cobros transf.</span>
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

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* COLUMNA UNICA / PRINCIPAL: COBROS REALIZADOS HOY + GASTOS */}
              <div className="lg:col-span-12 space-y-6">
                
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h2 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Cobros Ingresados Hoy ({cobrosRealizados.length})
                  </h2>

                  <div className="max-h-[240px] overflow-y-auto space-y-2 pr-1">
                    {cobrosRealizados.length > 0 ? (
                      cobrosRealizados.map((c, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between text-xs">
                          <div>
                            <span className="text-white font-bold">{c.cliente}</span>
                            <span className="block text-[10px] text-slate-400 uppercase font-mono">{c.pedidoId} • Medio: {c.medioPago}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-mono font-bold text-emerald-400 text-sm">+${Number(c.monto).toLocaleString('es-AR')}</span>
                            <button
                              onClick={() => eliminarCobro(c.id)}
                              className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer p-1"
                              title="Anular cobro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-500 text-xs">
                        Aún no se registró ningún cobro en este turno. Ve al módulo de pedidos y haz clic en el botón de cobro / CC para registrar ingresos.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Registrar Gasto o Ingreso Extra en Caja
                  </h2>

                  <form onSubmit={registrarMovimientoManual} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setTipoMov('egreso')} className={`p-2.5 rounded-xl text-xs font-bold border cursor-pointer ${tipoMov === 'egreso' ? 'bg-rose-500 text-slate-950 border-rose-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                        Egreso / Gasto (-)
                      </button>
                      <button type="button" onClick={() => setTipoMov('ingreso')} className={`p-2.5 rounded-xl text-xs font-bold border cursor-pointer ${tipoMov === 'ingreso' ? 'bg-emerald-500 text-slate-950 border-emerald-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`} >
                        Ingreso Extra (+)
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setMedioPagoMov('efectivo')} className={`p-2.5 rounded-xl text-xs font-bold border cursor-pointer ${medioPagoMov === 'efectivo' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                        Efectivo
                      </button>
                      <button type="button" onClick={() => setMedioPagoMov('transferencia')} className={`p-2.5 rounded-xl text-xs font-bold border cursor-pointer ${medioPagoMov === 'transferencia' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                        Transferencia
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" value={montoMov || ''} onChange={(e) => setMontoMov(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" placeholder="Monto ($)" required />
                      <input type="text" value={descMov} onChange={(e) => setDescMov(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" placeholder="Concepto (ej. Gasoil)" required />
                    </div>

                    <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
                      <PlusCircle className="w-3.5 h-3.5" /> Registrar en Caja
                    </button>
                  </form>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* MODAL CUENTA CORRIENTE (CC) */}
        {modalCCAbierto && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-500" /> Detalle de Cuenta Corriente (CC)
                  </h3>
                  <p className="text-xs text-slate-400">Clientes con saldo pendiente desde el Sábado 19/09 en adelante.</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase">Deuda Total CC</span>
                  <span className="font-mono font-bold text-amber-400 text-base">${deudaTotalCC.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-3 pr-1">
                {listaClientesCC.length > 0 ? (
                  listaClientesCC.map((cliente: any, idx: number) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">{cliente.nombre}</span>
                        <span className="font-mono font-bold text-amber-400 text-sm">${cliente.deudaTotal.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-2">
                        <span>{cliente.cantidadPedidos} pedido(s) pendiente(s)</span>
                        <div className="flex flex-wrap gap-1 font-mono text-[10px] max-w-[60%] justify-end">
                          {cliente.pedidos.map((p: any, pIdx: number) => (
                            <span key={pIdx} className="bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                              {p.id || 'S/N'} (${Number(p.total || 0).toLocaleString('es-AR')})
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs">
                    No hay clientes con saldo pendiente desde el 19/09. ¡Todo al día!
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setModalCCAbierto(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-3 rounded-xl transition-colors cursor-pointer"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        )}

        {modalCierreAbierto && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-500" /> Auditoría Diaria y Cierre
                </h3>
                <p className="text-xs text-slate-400">
                  El sistema consolidó automáticamente los cobros y movimientos del turno. Ingresa el efectivo real contado en gaveta.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Efectivo Esperado (Sistema):</span>
                  <span className="font-mono font-bold text-emerald-400">${efectivoEsperadoEnCaja.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Transferencias Disponibles Totales:</span>
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