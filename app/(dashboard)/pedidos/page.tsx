'use client';
import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Package, 
  UserCheck, 
  X, 
  Edit3, 
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  Share2,
  Printer,
  Calendar,
  FileText
} from 'lucide-react';
import { useInventario, ItemPedido, Pedido, Cliente } from '@/context/InventarioContext';

export default function PedidosPage() {
  const { 
    productos, 
    pedidos, 
    clientes, 
    registrarPedido, 
    actualizarEstadoPedido, 
    actualizarRetiroAcopio,
    actualizarPedidoCompleto,
    eliminarPedido
  } = useInventario() as any;

  const [montado, setMontado] = useState(false);
  useEffect(() => {
    setMontado(true);
  }, []);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [busquedaClienteInput, setBusquedaClienteInput] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  
  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [direccionEntrega, setDireccionEntrega] = useState('');
  const [requiereGrua, setRequiereGrua] = useState<'SI' | 'NO'>('NO');
  const [observacionesPedido, setObservacionesPedido] = useState('');
  const [fechaEntregaPactada, setFechaEntregaPactada] = useState('');
  
  const [itemsPedido, setItemsPedido] = useState<ItemPedido[]>([]);
  const [productoIdTemp, setProductoIdTemp] = useState('');
  const [cantidadTemp, setCantidadTemp] = useState<number | string>(1);
  const [modalAcopioAbierto, setModalAcopioAbierto] = useState(false);
  const [pedidoSeleccionadoAcopio, setPedidoSeleccionadoAcopio] = useState<Pedido | null>(null);
  const [itemAcopioSeleccionado, setItemAcopioSeleccionado] = useState<ItemPedido | null>(null);
  const [cantidadRetiroTemp, setCantidadRetiroTemp] = useState<number | string>(1);
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [pedidoEnEdicion, setPedidoEnEdicion] = useState<any | null>(null);
  const [itemsEditadosTemp, setItemsEditadosTemp] = useState<ItemPedido[]>([]);
  const [observacionCancelacion, setObservacionCancelacion] = useState('');
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  const clientesFiltradosSugerencias = clientes.filter((c: Cliente) => 
    c.nombre.toLowerCase().includes(busquedaClienteInput.toLowerCase()) || 
    c.id.toLowerCase().includes(busquedaClienteInput.toLowerCase()) ||
    c.telefono.includes(busquedaClienteInput)
  );

  const seleccionarClienteExistente = (cli: Cliente) => {
    setClienteSeleccionado(cli);
    setBusquedaClienteInput(cli.nombre);
    setNombreCliente(cli.nombre);
    setTelefonoCliente(cli.telefono);
    setDireccionEntrega(cli.direccion);
  };

  const limpiarClienteSeleccionado = () => {
    setClienteSeleccionado(null);
    setBusquedaClienteInput('');
    setNombreCliente('');
    setTelefonoCliente('');
    setDireccionEntrega('');
  };

  const agregarItemAlPedido = () => {
    if (!productoIdTemp) return;
    const prod = productos.find((p: any) => p.id === productoIdTemp);
    if (!prod) return;
    const cant = parseFloat(String(cantidadTemp).replace(',', '.')) || 1;
    if (cant <= 0) return;

    const existeIndex = itemsPedido.findIndex(i => i.productoId === prod.id);
    if (existeIndex >= 0) {
      const nuevos = [...itemsPedido];
      nuevos[existeIndex].cantidad += cant;
      if (nuevos[existeIndex].acopio?.esAcopio) {
        nuevos[existeIndex].acopio!.cantidadAcopiadaInicial = nuevos[existeIndex].cantidad;
        nuevos[existeIndex].acopio!.cantidadPendienteRetiro = nuevos[existeIndex].cantidad;
      }
      setItemsPedido(nuevos);
    } else {
      setItemsPedido([
        ...itemsPedido,
        {
          productoId: prod.id,
          codigo: prod.codigo,
          nombre: prod.nombre,
          precioUnitario: prod.precio,
          cantidad: cant,
          estadoItem: 'Pendiente',
          acopio: {
            esAcopio: false,
            diasResguardo: 30,
            cantidadAcopiadaInicial: cant,
            cantidadPendienteRetiro: 0
          }
        }
      ]);
    }
    setProductoIdTemp('');
    setCantidadTemp(1);
  };

  const quitarItemPedido = (index: number) => {
    setItemsPedido(itemsPedido.filter((_, i) => i !== index));
  };

  const toggleAcopioItem = (index: number) => {
    const nuevos = [...itemsPedido];
    const item = nuevos[index];
    const estadoActualAcopio = item.acopio?.esAcopio || false;
    if (!estadoActualAcopio) {
      item.acopio = {
        esAcopio: true,
        diasResguardo: 30,
        fechaEntregaPactada: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        cantidadAcopiadaInicial: item.cantidad,
        cantidadPendienteRetiro: item.cantidad
      };
    } else {
      item.acopio = {
        esAcopio: false,
        diasResguardo: 30,
        cantidadAcopiadaInicial: item.cantidad,
        cantidadPendienteRetiro: 0
      };
    }
    setItemsPedido(nuevos);
  };

  const actualizarDiasAcopioItem = (index: number, dias: number) => {
    const nuevos = [...itemsPedido];
    if (nuevos[index].acopio) {
      nuevos[index].acopio!.diasResguardo = dias;
    }
    setItemsPedido(nuevos);
  };

  const handleGuardarPedido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCliente || itemsPedido.length === 0) return;
    const total = itemsPedido.reduce((acc, item) => acc + (item.precioUnitario * item.cantidad), 0);
    registrarPedido({
      clienteId: clienteSeleccionado ? clienteSeleccionado.id : `CLI-${Date.now().toString().slice(-4)}`,
      nombreCliente,
      telefonoCliente,
      direccionEntrega,
      requiereGrua,
      observaciones: observacionesPedido,
      fechaEntregaPactada,
      items: itemsPedido,
      total,
      estado: 'Pendiente'
    } as any);
    setModalAbierto(false);
    limpiarClienteSeleccionado();
    setItemsPedido([]);
    setRequiereGrua('NO');
    setObservacionesPedido('');
    setFechaEntregaPactada('');
  };

  const abrirModalEdicion = (pedido: any) => {
    setPedidoEnEdicion({ ...pedido });
    setItemsEditadosTemp(JSON.parse(JSON.stringify(pedido.items || [])));
    setObservacionCancelacion(pedido.observacionCancelacion || '');
    setModalEdicionAbierto(true);
  };

  const guardarCambiosPedidoEdicion = () => {
    if (!pedidoEnEdicion) return;
    const nuevoTotal = itemsEditadosTemp.reduce((acc, item) => acc + ((item.precioUnitario || 0) * (item.cantidad || 0)), 0);
    
    const pedidoActualizado: any = {
      ...pedidoEnEdicion,
      total: nuevoTotal,
      items: itemsEditadosTemp,
      observacionCancelacion
    };
    if (actualizarPedidoCompleto) {
      actualizarPedidoCompleto(pedidoActualizado);
    }
    setModalEdicionAbierto(false);
    setPedidoEnEdicion(null);
  };

  const agregarItemEnEdicion = () => {
    if (!pedidoEnEdicion) return;
    const prodEjemplo = productos[0];
    const nuevoItem: ItemPedido = {
      productoId: prodEjemplo ? prodEjemplo.id : 'PRD-NEW',
      codigo: prodEjemplo ? prodEjemplo.codigo : 'NEW',
      nombre: 'Nuevo producto (editar)',
      precioUnitario: prodEjemplo ? prodEjemplo.precio : 0,
      cantidad: 1,
      estadoItem: 'Pendiente',
      acopio: { esAcopio: false, diasResguardo: 30, cantidadAcopiadaInicial: 1, cantidadPendienteRetiro: 0 }
    };
    setItemsEditadosTemp([...itemsEditadosTemp, nuevoItem]);
  };
const enviarWhatsAppPendiente = (pedido: any) => {
    let telefonoLimpio = (pedido.telefonoCliente || '').replace(/\D/g, '');
    if (telefonoLimpio && !telefonoLimpio.startsWith('54')) {
      telefonoLimpio = `549${telefonoLimpio}`;
    }
    
    const idParam = pedido.id; // Usamos el ID único
    const urlSeguimiento = `${window.location.origin}/seguimiento?id=${idParam}`;
    
    const nroLimpio = String(pedido.nroPedido || '').replace('#', '');
    const textoMensaje = 
      `¡Hola *${pedido.nombreCliente}*! ¿Cómo andás? Te escribimos de parte del corralón para confirmarte que ya ingresamos tu pedido *#${nroLimpio}*. 🏗️\n\n` +
      `¿Querés saber el estado de tu pedido? Ingresá a este link y chequealo en tiempo real:\n${urlSeguimiento}\n\n` +
      `¡Muchísimas gracias por confiar en nosotros! 🙌`;

    const urlWhatsApp = `https://api.whatsapp.com/send?phone=${telefonoLimpio}&text=${encodeURIComponent(textoMensaje)}`;
    window.open(urlWhatsApp, '_blank');
  };
  };

  const copiarLinkSeguimiento = (pedido: any) => {
    const idParam = pedido.id; // Usamos el ID único (ej: PED-1788542764249)
    const urlSeguimiento = `${window.location.origin}/seguimiento?id=${idParam}`;
    navigator.clipboard.writeText(urlSeguimiento);
    setCopiadoId(pedido.id);
    setTimeout(() => setCopiadoId(null), 2500);
  };

  function imprimirComprobante(p: any) {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante - ZETA CORRALÓN (#${p.nroPedido})</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #111; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 15px; margin-bottom: 20px; }
            .logo-area h1 { margin: 0; font-size: 26px; color: #ea580c; font-weight: 900; letter-spacing: 0.5px; }
            .logo-area p { margin: 3px 0; font-size: 11px; color: #444; }
            .ticket-info { text-align: right; }
            .ticket-info h2 { margin: 0; font-size: 16px; color: #333; }
            .ticket-info p { margin: 3px 0; font-size: 12px; color: #666; }
            .section-title { font-size: 13px; font-weight: bold; background: #f3f4f6; padding: 6px 10px; margin-top: 15px; margin-bottom: 10px; border-left: 4px solid #ea580c; text-transform: uppercase; }
            .info-grid { font-size: 12px; margin-bottom: 15px; line-height: 1.5; }
            .info-grid p { margin: 3px 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; }
            th { background-color: #f9fafb; font-weight: bold; color: #374151; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-box { text-align: right; font-size: 16px; font-weight: bold; margin-top: 15px; color: #111; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; font-size: 11px; }
            .sig-line { width: 40%; border-top: 1px solid #333; text-align: center; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-area">
              <h1>ZETA CORRALÓN</h1>
              <p><strong>Dirección:</strong> Av. Pres. Juan Domingo Perón 4275, Derqui</p>
              <p><strong>WhatsApp / Tel:</strong> 11 6830 4581</p>
              <p><strong>Medios de pago:</strong> Efectivo, Transferencia, Mercado Pago, MODO, Tarjetas</p>
            </div>
            <div class="ticket-info">
              <h2>COMPROBANTE DE VENTA</h2>
              <p><strong>N° Pedido:</strong> #${p.nroPedido}</p>
              <p><strong>Fecha:</strong> ${p.fecha}</p>
              ${p.fechaEntregaPactada ? `<p><strong>Reprogramación / Acopio:</strong> ${p.fechaEntregaPactada}</p>` : ''}
            </div>
          </div>

          <div class="section-title">Datos del Cliente</div>
          <div class="info-grid">
            <p><strong>Cliente:</strong> ${p.nombreCliente || 'Consumidor Final'}</p>
            <p><strong>Teléfono:</strong> ${p.telefonoCliente || 'No especificado'}</p>
            <p><strong>Dirección de Entrega:</strong> ${p.direccionEntrega || 'Retiro en local'}</p>
            <p><strong>Camión con Grúa:</strong> ${p.requiereGrua || 'NO'}</p>
            <p><strong>Estado:</strong> ${p.estado.toUpperCase()}</p>
            ${p.observaciones ? `<p><strong>Observaciones:</strong> ${p.observaciones}</p>` : ''}
          </div>

          <div class="section-title">Detalle de Productos del Pedido</div>
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Producto</th>
                <th class="text-center">Cant.</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${(p.items || []).map((item: any) => `
                <tr>
                  <td>${item.codigo || 'PRD'}</td>
                  <td>${item.nombre}</td>
                  <td class="text-center">${item.cantidad}</td>
                  <td class="text-right">$${(item.precioUnitario || 0).toLocaleString('es-AR')}</td>
                  <td class="text-right">$${((item.precioUnitario || 0) * item.cantidad).toLocaleString('es-AR')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-box">
            Monto Total: $${(p.total || 0).toLocaleString('es-AR')}
          </div>

          <div class="signatures">
            <div class="sig-line">Firma y Aclaración (Caja / Administración)</div>
            <div class="sig-line">Firma del Cliente</div>
          </div>
        </body>
      </html>
    `;

    ventanaImpresion.document.write(html);
    ventanaImpresion.document.close();
    setTimeout(() => {
      ventanaImpresion.print();
    }, 300);
  }

  const pedidosFiltrados = pedidos.filter((p: any) => {
    const coincideBusq = (p.nombreCliente || '').toLowerCase().includes(busqueda.toLowerCase()) || 
                         (p.nroPedido || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                         (p.telefonoCliente || '').includes(busqueda);
                         
    const estadoPedido = (p.estado || 'Pendiente').trim().toLowerCase();
    const estadoFiltro = filtroEstado.trim().toLowerCase();
    
    const coincideEstado = estadoFiltro === 'todos' || estadoPedido === estadoFiltro;
    return coincideBusq && coincideEstado;
  });

  if (!montado) return null;

  return (
    <div className="p-8 w-full space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <ClipboardList className="w-8 h-8 text-amber-500" />
            Gestión de Pedidos y Acopios
          </h1>
          <p className="text-slate-400 mt-1">
            Registro de clientes por ID, control de entregas, acopios reprogramables y observaciones.
          </p>
        </div>
        <button 
          onClick={() => setModalAbierto(true)}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/10 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Registrar Nuevo Pedido
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, N° pedido o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {['todos', 'pendiente', 'preparado', 'entregado', 'cancelado'].map((est) => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer whitespace-nowrap ${
                filtroEstado === est 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-4">Pedido / Fecha</th>
                <th className="px-5 py-4">Cliente (ID / Datos)</th>
                <th className="px-5 py-4">Detalle de Ítems, Acopios y Obs.</th>
                <th className="px-5 py-4 text-center">Grúa</th>
                <th className="px-5 py-4 text-right">Total ($)</th>
                <th className="px-5 py-4 text-center">Estado General</th>
                <th className="px-5 py-4 text-right">Acciones / Retiros</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map((p: any) => {
                  const estadoActual = (p.estado || 'Pendiente').toLowerCase();
                  function enviarWhatsAppPreparado(p: any) {
                    throw new Error('Function not implemented.');
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono text-xs">
                        <span className="font-bold text-amber-500 text-sm">{p.nroPedido}</span>
                        <div className="text-slate-500 mt-0.5">{p.fecha}</div>
                        {p.fechaEntregaPactada && (
                          <div className="mt-1 text-[11px] text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Prog: {p.fechaEntregaPactada}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-slate-100">{p.nombreCliente}</div>
                        <div className="text-xs text-amber-400 font-mono mt-0.5">{p.clienteId}</div>
                        <div className="text-xs text-slate-400">{p.telefonoCliente}</div>
                        <div className="text-xs text-slate-500">{p.direccionEntrega}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5 max-w-md">
                          {(p.items || []).map((item: any, idx: number) => (
                            <div key={idx} className="text-xs bg-slate-950/60 border border-slate-800/80 p-2 rounded-lg">
                              <div className="flex justify-between font-medium text-slate-200">
                                <span>{item.cantidad}x {item.nombre}</span>
                                <span className="text-emerald-400">${((item.precioUnitario || 0) * item.cantidad).toLocaleString('es-AR')}</span>
                              </div>
                              {item.acopio?.esAcopio && (
                                <div className="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                                  <span className="text-purple-400 font-semibold flex items-center gap-1">
                                    <Package className="w-3 h-3" /> Acopiado ({item.acopio.diasResguardo} días)
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 font-medium">
                                      Pendiente: <strong className="text-purple-300">{item.acopio.cantidadPendienteRetiro}</strong> / {item.acopio.cantidadAcopiadaInicial}
                                    </span>
                                    {item.acopio.cantidadPendienteRetiro > 0 && estadoActual !== 'entregado' && estadoActual !== 'cancelado' && (
                                      <button
                                        onClick={() => {
                                          setPedidoSeleccionadoAcopio(p);
                                          setItemAcopioSeleccionado(item);
                                          setCantidadRetiroTemp(1);
                                          setModalAcopioAbierto(true);
                                        }}
                                        className="bg-purple-600 hover:bg-purple-500 text-white px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                                      >
                                        Retirar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                          {p.observaciones && (
                            <div className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-300 p-2 rounded-lg flex items-start gap-1.5 mt-2">
                              <FileText className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span><strong>Obs:</strong> {p.observaciones}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.requiereGrua === 'SI' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-slate-800 text-slate-400'}`}>
                          {p.requiereGrua}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-emerald-400">
                        ${(p.total || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <select
                          value={p.estado || 'Pendiente'}
                          onChange={(e) => actualizarEstadoPedido(p.id, e.target.value as Pedido['estado'])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize cursor-pointer focus:outline-none border ${
                            estadoActual === 'pendiente' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                            estadoActual === 'preparado' ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' :
                            estadoActual === 'entregado' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          <option value="Pendiente" className="bg-slate-900 text-slate-200">Pendiente</option>
                          <option value="Preparado" className="bg-slate-900 text-slate-200">Preparado</option>
                          <option value="Entregado" className="bg-slate-900 text-slate-200">Entregado</option>
                          <option value="Cancelado" className="bg-slate-900 text-slate-200">Cancelado</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => imprimirComprobante(p)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Imprimir comprobante oficial de venta"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-400" />
                            Imprimir
                          </button>

                          <button
                            onClick={() => copiarLinkSeguimiento(p)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Copiar enlace de seguimiento para el cliente"
                          >
                            <Share2 className="w-3.5 h-3.5 text-sky-400" />
                            {copiadoId === p.id ? '¡Copiado!' : 'Link'}
                          </button>

                          {p.telefonoCliente && (
                            <button
                              onClick={() => {
                                if (estadoActual === 'preparado') {
                                  enviarWhatsAppPreparado(p);
                                } else if (estadoActual === 'entregado') {
                                  enviarWhatsAppPendiente(p);
                                } else {
                                  enviarWhatsAppPendiente(p);
                                }
                              }}
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Enviar WhatsApp al cliente"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WApp
                            </button>
                          )}

                          <button
                            onClick={() => abrirModalEdicion(p)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Editar datos, reprogramación, ítems y observaciones"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                            Editar
                          </button>

                          {estadoActual !== 'entregado' && estadoActual !== 'cancelado' && (
                            <button
                              onClick={() => {
                                actualizarEstadoPedido(p.id, 'Entregado');
                                if (p.telefonoCliente) enviarWhatsAppPendiente(p);
                              }}
                              className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                              title="Finalizar Pedido, descontar del stock y enviar WhatsApp"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              Finalizar
                            </button>
                          )}

                          <button
                            onClick={() => {
                              if (confirm(`¿Estás seguro de eliminar el pedido ${p.nroPedido}?`)) {
                                eliminarPedido(p.id);
                              }
                            }}
                            className="bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                            title="Eliminar pedido permanentemente"
                          >
                            <X className="w-3.5 h-3.5" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron pedidos registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalEdicionAbierto && pedidoEnEdicion && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-500" />
                Editar Pedido {pedidoEnEdicion.nroPedido}
              </h3>
              <button 
                onClick={() => setModalEdicionAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Nombre del Cliente</label>
                <input
                  type="text"
                  value={pedidoEnEdicion.nombreCliente || ''}
                  onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, nombreCliente: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Teléfono</label>
                <input
                  type="text"
                  value={pedidoEnEdicion.telefonoCliente || ''}
                  onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, telefonoCliente: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Dirección de Entrega</label>
                <input
                  type="text"
                  value={pedidoEnEdicion.direccionEntrega || ''}
                  onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, direccionEntrega: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">¿Grúa?</label>
                  <select
                    value={pedidoEnEdicion.requiereGrua || 'NO'}
                    onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, requiereGrua: e.target.value as 'SI' | 'NO' })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
                  >
                    <option value="NO">NO</option>
                    <option value="SI">SI</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Estado</label>
                  <select
                    value={(pedidoEnEdicion.estado || 'Pendiente')}
                    onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, estado: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Preparado">Preparado</option>
                    <option value="Entregado">Entregado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1 bg-purple-500/10 border border-purple-500/30 p-3 rounded-xl">
              <label className="block text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Reprogramación / Fecha de Entrega Pactada (Acopio)
              </label>
              <input
                type="date"
                value={pedidoEnEdicion.fechaEntregaPactada || ''}
                onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, fechaEntregaPactada: e.target.value })}
                className="w-full bg-slate-950 border border-purple-500/30 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-purple-500 font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">Utiliza este campo si el cliente programa o reprograma la entrega del pedido para otro día u otra semana.</p>
            </div>

            <div className="space-y-1 bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl">
              <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Observaciones Abiertas del Pedido
              </label>
              <textarea
                rows={2}
                placeholder="Describa cualquier situación, especificación o pedido especial del cliente..."
                value={pedidoEnEdicion.observaciones || ''}
                onChange={(e) => setPedidoEnEdicion({ ...pedidoEnEdicion, observaciones: e.target.value })}
                className="w-full bg-slate-950 border border-amber-500/30 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-amber-500"
              />
            </div>

            {pedidoEnEdicion.estado === 'Cancelado' && (
              <div className="space-y-1 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl">
                <label className="block text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Motivo de Cancelación
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingrese el detalle o motivo de la cancelación..."
                  value={observacionCancelacion}
                  onChange={(e) => setObservacionCancelacion(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-500/30 text-slate-100 text-xs rounded-lg p-2.5 focus:outline-none focus:border-rose-500"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Ítems del Pedido (Cantidades y Estados)</label>
                <button
                  type="button"
                  onClick={agregarItemEnEdicion}
                  className="text-xs text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Ítem Rápido
                </button>
              </div>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {itemsEditadosTemp.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
                    <div className="flex-1 w-full">
                      <div className="font-bold text-slate-100 text-xs">{item.nombre}</div>
                      <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-1">
                        <span>Unit: ${item.precioUnitario}</span>
                        <span>|</span>
                        <span className="text-emerald-400 font-semibold">Subtotal: ${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Cantidad</label>
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={item.cantidad}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const nuevos = [...itemsEditadosTemp];
                            nuevos[idx].cantidad = val;
                            if (nuevos[idx].acopio?.esAcopio) {
                              nuevos[idx].acopio!.cantidadAcopiadaInicial = val;
                              nuevos[idx].acopio!.cantidadPendienteRetiro = val;
                            }
                            setItemsEditadosTemp(nuevos);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1 text-center focus:outline-none focus:border-amber-500 font-mono"
                        />
                      </div>
                      <div className="w-32">
                        <label className="block text-[10px] text-slate-500 mb-0.5">Estado Ítem</label>
                        <select
                          value={item.estadoItem || 'Pendiente'}
                          onChange={(e) => {
                            const nuevos = [...itemsEditadosTemp];
                            nuevos[idx].estadoItem = e.target.value as 'Pendiente' | 'Entregado' | 'Anulado';
                            setItemsEditadosTemp(nuevos);
                          }}
                          className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option value="Entregado">Entregado</option>
                          <option value="Anulado">Anulado</option>
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => setItemsEditadosTemp(itemsEditadosTemp.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 p-1.5 mt-4 cursor-pointer"
                        title="Quitar ítem"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalEdicionAbierto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarCambiosPedidoEdicion}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Guardar Todos los Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-amber-500" />
                Registrar Nuevo Pedido
              </h2>
              <button 
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleGuardarPedido} className="space-y-6">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Datos del Cliente (ID / Nombre)
                  </label>
                  {clienteSeleccionado && (
                    <button 
                      type="button" 
                      onClick={limpiarClienteSeleccionado}
                      className="text-xs text-slate-400 hover:text-amber-400 underline cursor-pointer"
                    >
                      Cambiar / Nuevo cliente
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por ID o Nombre para autocompletar..."
                    value={busquedaClienteInput}
                    onChange={(e) => {
                      setBusquedaClienteInput(e.target.value);
                      setNombreCliente(e.target.value);
                      if (clienteSeleccionado) setClienteSeleccionado(null);
                    }}
                    className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  />
                  {busquedaClienteInput.trim().length > 0 && !clienteSeleccionado && clientesFiltradosSugerencias.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1 bg-slate-900 border border-slate-800 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                      {clientesFiltradosSugerencias.map((cli: any) => (
                        <div
                          key={cli.id}
                          onClick={() => seleccionarClienteExistente(cli)}
                          className="px-4 py-2.5 hover:bg-slate-800 cursor-pointer text-xs flex items-center justify-between border-b border-slate-800/40 last:border-none"
                        >
                          <div>
                            <span className="font-bold text-slate-100">{cli.nombre}</span>
                            <span className="text-slate-400 ml-2">({cli.telefono})</span>
                          </div>
                          <span className="font-mono text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">{cli.id}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={nombreCliente}
                      onChange={(e) => setNombreCliente(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Teléfono de Contacto</label>
                    <input
                      type="text"
                      placeholder="Ej. 11 2345-6789"
                      value={telefonoCliente}
                      onChange={(e) => setTelefonoCliente(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Dirección de Entrega *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Av. San Martín 1234"
                      value={direccionEntrega}
                      onChange={(e) => setDireccionEntrega(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">¿Requiere Grúa?</label>
                    <select
                      value={requiereGrua}
                      onChange={(e) => setRequiereGrua(e.target.value as 'SI' | 'NO')}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    >
                      <option value="NO">NO</option>
                      <option value="SI">SI</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-purple-300 mb-1">Reprogramación / Fecha Pactada</label>
                    <input
                      type="date"
                      value={fechaEntregaPactada}
                      onChange={(e) => setFechaEntregaPactada(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-purple-500/30 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-amber-300 mb-1">Observaciones del Pedido</label>
                    <input
                      type="text"
                      placeholder="Ej. Entregar por la tarde..."
                      value={observacionesPedido}
                      onChange={(e) => setObservacionesPedido(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-amber-500/30 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">Agregar Productos al Pedido</label>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <select
                      value={productoIdTemp}
                      onChange={(e) => setProductoIdTemp(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">-- Seleccionar producto del inventario --</option>
                      {productos.map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.codigo} - {p.nombre} (Disp: {p.stockActual}) - ${p.precio.toLocaleString('es-AR')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={cantidadTemp}
                      onChange={(e) => {
                        const val = e.target.value.replace(',', '.');
                        if (val === '' || !isNaN(Number(val))) {
                          setCantidadTemp(val);
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2.5 text-center focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="Cant"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={agregarItemAlPedido}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Añadir
                  </button>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto mt-2">
                  {itemsPedido.length > 0 ? (
                    itemsPedido.map((item, index) => (
                      <div key={index} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-slate-100 text-xs">{item.nombre}</span>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Cant: {item.cantidad} | Unitario: ${item.precioUnitario.toLocaleString('es-AR')} | Subtotal: <strong className="text-emerald-400">${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}</strong>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => quitarItemPedido(index)}
                            className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={item.acopio?.esAcopio || false}
                              onChange={() => toggleAcopioItem(index)}
                              className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                            />
                            <span className={`text-xs font-semibold ${item.acopio?.esAcopio ? 'text-purple-400 font-bold' : 'text-slate-400'}`}>
                              📦 Marcar como Acopio (Guardar material)
                            </span>
                          </label>
                          {item.acopio?.esAcopio && (
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-slate-400">Plazo (días):</span>
                              <input
                                type="number"
                                min="1"
                                value={item.acopio.diasResguardo}
                                onChange={(e) => actualizarDiasAcopioItem(index, parseInt(e.target.value) || 30)}
                                className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 text-center focus:outline-none focus:border-amber-500 font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                      Ningún producto agregado al pedido todavía.
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={itemsPedido.length === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-semibold rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalAcopioAbierto && pedidoSeleccionadoAcopio && itemAcopioSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-purple-400" />
                Retiro Parcial de Acopio
              </h3>
              <button 
                onClick={() => setModalAcopioAbierto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div><strong className="text-slate-400">Cliente:</strong> {pedidoSeleccionadoAcopio.nombreCliente}</div>
              <div><strong className="text-slate-400">Producto:</strong> {itemAcopioSeleccionado.nombre}</div>
              <div><strong className="text-slate-400">Total Acopiado Original:</strong> {itemAcopioSeleccionado.acopio?.cantidadAcopiadaInicial}</div>
              <div><strong className="text-purple-400">Pendiente de Retiro Actual:</strong> {itemAcopioSeleccionado.acopio?.cantidadPendienteRetiro}</div>
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300">Cantidad que retira ahora:</label>
              <input
                type="text"
                inputMode="decimal"
                value={cantidadRetiroTemp}
                onChange={(e) => {
                  const val = e.target.value.replace(',', '.');
                  if (val === '' || !isNaN(Number(val))) {
                    setCantidadRetiroTemp(val);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500 font-bold font-mono"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModalAcopioAbierto(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const cantRetiroNum = parseFloat(String(cantidadRetiroTemp).replace(',', '.')) || 0;
                  if (cantRetiroNum > 0) {
                    actualizarRetiroAcopio(pedidoSeleccionadoAcopio.id, itemAcopioSeleccionado.productoId, cantRetiroNum);
                    setModalAcopioAbierto(false);
                  }
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
              >
                Confirmar Retiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}