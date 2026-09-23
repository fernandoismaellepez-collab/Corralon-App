'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { DollarSign, Wallet, ArrowUpRight, ArrowDownLeft, Lock, Unlock, PlusCircle, CheckCircle, AlertCircle, RefreshCw, Calculator, ShieldCheck, ShoppingCart, Download, Trash2, History, Calendar, Edit3 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function CajaPage() {
  const [turnoActual, setTurnoActual] = useState<any>(null);
  const [ultimoTurnoCerrado, setUltimoTurnoCerrado] = useState<any>(null);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [ventasPedidos, setVentasPedidos] = useState<any[]>([]);
  const [todosLosPedidosDebug, setTodosLosPedidosDebug] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);

  const [filtroVentas, setFiltroVentas] = useState<'todos' | 'efectivo' | 'transferencia'>('todos');

  const [operador, setOperador] = useState('Operador Corralón');
  const [montoInicial, setMontoInicial] = useState<number>(10000);
  const [saldoTransferenciaInicial, setSaldoTransferenciaInicial] = useState<number>(0);
  
  const [tipoMov, setTipoMov] = useState<'ingreso' | 'egreso'>('egreso');
  const [medioPagoMov, setMedioPagoMov] = useState<'efectivo' | 'transferencia'>('efectivo');
  const [montoMov, setMontoMov] = useState<number>(0);
  const [descMov, setDescMov] = useState('');

  const [montoDeclarado, setMontoDeclarado] = useState<number>(0);
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const [editandoSaldoTransf, setEditandoSaldoTransf] = useState(false);
  const [nuevoSaldoTransfEdit, setNuevoSaldoTransfEdit] = useState<number>(0);

  useEffect(() => {
    verificarTurnoActivo();
  }, []);

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

  const obtenerFechaPedidoStr = (p: any) => {
    const fechaBruta = p.fecha || p.creado_en || p.createdAt || p.fecha_creacion || '';
    const progBruta = p.prog || p.fechaProgramada || p.programadoPara || '';
    const strFecha = String(fechaBruta).slice(0, 10);
    const strProg = String(progBruta).slice(0, 10);
    return strFecha || strProg || new Date().toISOString().slice(0, 10);
  };

  const verificarTurnoActivo = async () => {
    setCargando(true);
    try {
      const { data: appData, error: appError } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'pedidos')
        .single();

      let pedidosCargados = [];
      if (!appError && appData?.payload) {
        pedidosCargados = appData.payload.filter((p: any) => {
          const estado = String(p.estado || p.status || '').trim().toLowerCase();
          return estado !== 'cancelado';
        });
        setVentasPedidos(pedidosCargados);
        setTodosLosPedidosDebug(appData.payload);
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
      } else if (turnosData.ultimoCierre?.total_transferencia_sistema !== undefined) {
        setSaldoTransferenciaInicial(Number(turnosData.ultimoCierre.total_transferencia_sistema));
      } else {
        setSaldoTransferenciaInicial(0);
      }

      if (turnosData.ultimoCierre?.monto_declarado_cierre) {
        setMontoInicial(Number(turnosData.ultimoCierre.monto_declarado_cierre));
      }

      if (turnosData.turnoAbierto && turnosData.turnoAbierto.id) {
        const { data: appMovs } = await supabase
          .from('app_data')
          .select('payload')
          .eq('id', `caja_movimientos_${turnosData.turnoAbierto.id}`)
          .single();
        setMovimientos(appMovs?.payload || []);
      } else {
        setMovimientos([]);
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

  const actualizarSaldoTransferenciaManual = async () => {
    if (!turnoActual) return;
    try {
      const turnoActualizado = {
        ...turnoActual,
        saldo_transferencia_inicial: Number(nuevoSaldoTransfEdit)
      };

      const { data: appTurnos } = await supabase
        .from('app_data')
        .select('payload')
        .eq('id', 'caja_turnos_estado')
        .single();

      await supabase
        .from('app_data')
        .upsert([{
          id: 'caja_turnos_estado',
          payload: {
            ...appTurnos?.payload,
            turnoAbierto: turnoActualizado
          },
          updated_at: new Date().toISOString()
        }]);

      setTurnoActual(turnoActualizado);
      setSaldoTransferenciaInicial(Number(nuevoSaldoTransfEdit));
      setEditandoSaldoTransf(false);
      alert('¡Saldo inicial de transferencia actualizado con éxito!');
    } catch (err: any) {
      alert('Error al actualizar saldo: ' + err.message);
    }
  };

  const registrarMovimientoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!turnoActual || montoMov <= 0 || !descMov.trim()) {
      alert('Por favor, completa todos los datos del movimiento.');
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
    if (!confirm('¿Estás seguro de eliminar este movimiento manual?')) return;
    try {
      const actualizados = movimientos.filter(m => m.id !== movId);
      
      if (turnoActual) {
        await supabase
          .from('app_data')
          .upsert([{
            id: `caja_movimientos_${turnoActual.id}`,
            payload: actualizados,
            updated_at: new Date().toISOString()
          }]);
      }

      setMovimientos(actualizados);
    } catch (err: any) {
      alert('Error al eliminar movimiento: ' + err.message);
    }
  };

  // Cálculos para el turno actual y fecha de hoy
  const fechaHoyStr = new Date().toISOString().slice(0, 10);
  
  const ventasDelTurnoActual = ventasPedidos.filter(p => {
    const fechaP = obtenerFechaPedidoStr(p);
    return fechaP === fechaHoyStr;
  });

  const totalEfectivoPedidos = ventasDelTurnoActual.reduce((acc, p) => {
    return clasificarMedioPago(p) === 'efectivo' ? acc + Number(p.total || 0) : acc;
  }, 0);

  const totalTransferenciaPedidos = ventasDelTurnoActual.reduce((acc, p) => {
    return clasificarMedioPago(p) === 'transferencia' ? acc + Number(p.total || 0) : acc;
  }, 0);

  const totalEfectivoMovimientos = movimientos.reduce((acc, m) => {
    if (m.medio_pago === 'efectivo') {
      return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto);
    }
    return acc;
  }, 0);

  const totalTransferenciaMovimientos = movimientos.reduce((acc, m) => {
    if (m.medio_pago === 'transferencia') {
      return m.tipo === 'ingreso' ? acc + Number(m.monto) : acc - Number(m.monto);
    }
    return acc;
  }, 0);

  const baseTransferenciasAnterior = Number(turnoActual?.saldo_transferencia_inicial ?? saldoTransferenciaInicial);

  const efectivoEsperadoEnCaja = Number(turnoActual?.monto_inicial || 0) + totalEfectivoPedidos + totalEfectivoMovimientos;
  const totalTransferenciasGeneral = baseTransferenciasAnterior + totalTransferenciaPedidos + totalTransferenciaMovimientos;

  // Filtrado y Agrupamiento por Días para el Historial
  const ventasFiltradasHistorial = ventasPedidos.filter(p => {
    const tipo = clasificarMedioPago(p);
    if (filtroVentas === 'efectivo') return tipo === 'efectivo';
    if (filtroVentas === 'transferencia') return tipo === 'transferencia';
    return true;
  });

  const ventasAgrupadasPorDia = ventasFiltradasHistorial.reduce((acc: any, p: any) => {
    const dia = obtenerFechaPedidoStr(p);
    if (!acc[dia]) {
      acc[dia] = [];
    }
    acc[dia].push(p);
    return acc;
  }, {});

  const diasOrdenados = Object.keys(ventasAgrupadasPorDia).sort().reverse();

  const exportarHistorialCSV = async () => {
    try {
      let csvContent = "\uFEFFFecha/Hora;Tipo Registro;Cliente / Concepto;Modo de Pago;Monto\n";
      ventasPedidos.forEach((p: any) => {
        const fechaP = new Date(p.fecha || p.creado_en || Date.now()).toLocaleString();
        const cliente = `"${(p.nombreCliente || 'Cliente General').replace(/"/g, '""')}"`;
        const modo = clasificarMedioPago(p);
        const montoP = Number(p.total || 0);
        csvContent += `${fechaP};Venta Pedido;${cliente};${modo};${montoP}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `historial_caja_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Error al exportar historial: ' + err.message);
    }
  };

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
              <Wallet className="w-4 h-4" /> Control Financiero
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Caja Diaria y Auditoría</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportarHistorialCSV}
              className="bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors shadow-lg"
            >
              <Download className="w-3.5 h-3.5" /> Exportar Historial Completo (CSV)
            </button>
            <button
              onClick={verificarTurnoActivo}
              className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sincronizar Datos
            </button>
          </div>
        </div>

        {ultimoTurnoCerrado && (
          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 uppercase tracking-wider">
                <History className="w-4 h-4 text-amber-400" /> Resumen Histórico / Cierre Turno Anterior ({new Date(ultimoTurnoCerrado.fecha_cierre || ultimoTurnoCerrado.fecha_apertura).toLocaleDateString()})
              </div>
              <span className="text-[10px] font-mono text-slate-500">Operador: {ultimoTurnoCerrado.operador}</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Efectivo Declarado Cierre</span>
                <span className="font-mono font-bold text-white text-base">${Number(ultimoTurnoCerrado.monto_declarado_cierre || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Transferencias Registradas</span>
                <span className="font-mono font-bold text-sky-400 text-base">${Number(ultimoTurnoCerrado.total_transferencia_sistema || 0).toLocaleString('es-AR')}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Diferencia / Arqueo</span>
                <span className={`font-mono font-bold text-base ${Number(ultimoTurnoCerrado.diferencia || 0) < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ${Number(ultimoTurnoCerrado.diferencia || 0).toLocaleString('es-AR')}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Estado</span>
                  <span className="font-bold text-amber-400 uppercase text-[11px]">Cerrado OK</span>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </div>
        )}

        {!turnoActual ? (
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-lg mx-auto shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                <Lock className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-white">Abrir Caja del Día / Nuevo Turno</h2>
              <p className="text-xs text-slate-400">Ingresa los saldos iniciales exactos para arrancar el turno.</p>
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

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Saldo Disponible en Transferencias Inicial ($)</label>
                <input
                  type="number"
                  value={saldoTransferenciaInicial}
                  onChange={(e) => setSaldoTransferenciaInicial(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-sky-400 font-mono font-bold"
                  required
                />
                <span className="text-[10px] text-slate-500 mt-1 block">Ingresa el saldo real que tenías en transferencias al cerrar ayer.</span>
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" /> Abrir Caja y Comenzar Turno Actual
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
                <span className="text-[10px] text-slate-500">Ventas efectivo + fondo + mov.</span>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-sky-400 uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Transferencias Disponibles</span>
                  <button 
                    onClick={() => {
                      setNuevoSaldoTransfEdit(baseTransferenciasAnterior);
                      setEditandoSaldoTransf(!editandoSaldoTransf);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
                    title="Editar saldo inicial de transferencia"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="block text-xl font-mono font-bold text-sky-400">${totalTransferenciasGeneral.toLocaleString('es-AR')}</span>
                <span className="text-[10px] text-slate-500 block">Saldo inicial (${baseTransferenciasAnterior.toLocaleString('es-AR')}) + ventas</span>

                {editandoSaldoTransf && (
                  <div className="absolute inset-0 bg-slate-950 p-4 rounded-2xl border border-sky-500/50 flex flex-col justify-center space-y-2 z-10">
                    <span className="text-[10px] font-bold text-sky-400 uppercase">Corregir saldo inicial de transferencia:</span>
                    <input
                      type="number"
                      value={nuevoSaldoTransfEdit}
                      onChange={(e) => setNuevoSaldoTransfEdit(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono"
                    />
                    <div className="flex gap-2">
                      <button onClick={() => setEditandoSaldoTransf(false)} className="flex-1 bg-slate-800 text-slate-300 text-[10px] py-1 rounded">Cancelar</button>
                      <button onClick={actualizarSaldoTransferenciaManual} className="flex-1 bg-sky-600 text-white text-[10px] py-1 rounded font-bold">Guardar</button>
                    </div>
                  </div>
                )}
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
              
              {/* HISTÓRICO DE TRANSACCIONES SEPARADO POR DÍAS */}
              <div className="lg:col-span-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Histórico de Transacciones ({ventasFiltradasHistorial.length})
                  </h2>

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

                <div className="max-h-[380px] overflow-y-auto space-y-4 pr-1">
                  {diasOrdenados.length > 0 ? (
                    diasOrdenados.map(dia => {
                      const pedidosDelDia = ventasAgrupadasPorDia[dia];
                      const totalDia = pedidosDelDia.reduce((sum: number, item: any) => sum + Number(item.total || 0), 0);

                      return (
                        <div key={dia} className="space-y-2">
                          <div className="flex items-center justify-between bg-slate-950/80 border border-slate-800 px-3 py-2 rounded-xl text-xs">
                            <span className="font-bold text-amber-400 flex items-center gap-1.5 font-mono">
                              <Calendar className="w-3.5 h-3.5" /> {dia}
                            </span>
                            <span className="font-mono text-emerald-400 font-bold">
                              Subtotal: ${totalDia.toLocaleString('es-AR')}
                            </span>
                          </div>

                          <div className="space-y-1.5 pl-1">
                            {pedidosDelDia.map((p: any, idx: number) => {
                              const medioDetectado = clasificarMedioPago(p);
                              return (
                                <div key={idx} className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between">
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
                            })}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 text-slate-500 text-xs">
                      No hay transacciones registradas bajo este filtro.
                    </div>
                  )}
                </div>
              </div>

              {/* REGISTRO DE GASTOS / INGRESOS */}
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
                    <input type="text" value={descMov} onChange={(e) => setDescMov(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" placeholder="Concepto (ej. Gasoil)" required />
                  </div>

                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5">
                    <PlusCircle className="w-3.5 h-3.5" /> Registrar Gasto / Descontar de Caja
                  </button>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Movimientos Registrados Hoy</span>
                  <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                    {movimientos.map((m, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="text-white font-medium">{m.descripcion}</span>
                          <span className="block text-[9px] text-slate-400 capitalize">{m.medio_pago} • {m.tipo}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`font-mono font-bold ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.tipo === 'ingreso' ? '+' : '-'}${Number(m.monto).toLocaleString('es-AR')}
                          </span>
                          <button
                            onClick={() => eliminarMovimientoManual(m.id)}
                            className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer p-1"
                            title="Eliminar movimiento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

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
                  El sistema consolidó automáticamente las ventas y movimientos en efectivo y transferencias. Ingresa el efectivo real contado en gaveta.
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