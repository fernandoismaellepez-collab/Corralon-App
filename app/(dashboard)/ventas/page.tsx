'use client';

import { useState, useEffect } from 'react';
import { useInventario, Pedido } from '@/context/InventarioContext';
import { 
  CheckCircle2, 
  Search, 
  Truck, 
  Eye, 
  FileText, 
  Printer, 
  X,
  DollarSign
} from 'lucide-react';

export default function VentasPage() {
  const { pedidos, rolUsuario } = useInventario();
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    setMontado(true);
  }, []);

  const [busqueda, setBusqueda] = useState('');
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState<Pedido | null>(null);

  const handleImprimirRemito = (pedido: Pedido) => {
    const ventanaImpresion = window.open('', '_blank');
    if (!ventanaImpresion) return;

    const contenidoHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comprobante de Venta / Pedido Finalizado - ${pedido.nroPedido}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #000; margin: 0; padding: 20px; font-size: 14px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px; }
          .company h1 { margin: 0; font-size: 20px; }
          .company p { margin: 2px 0; color: #555; font-size: 12px; }
          .invoice-info { text-align: right; }
          .invoice-info h2 { margin: 0; font-size: 18px; color: #333; }
          .invoice-info p { margin: 2px 0; font-size: 12px; }
          .section { margin-bottom: 20px; }
          .section-title { font-weight: bold; background: #eee; padding: 5px 10px; margin-bottom: 10px; font-size: 13px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #f4f4f4; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .signature-box { width: 40%; border-top: 1px solid #000; text-align: center; padding-top: 5px; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">
            <h1>Corralón / Materiales</h1>
            <p>Comprobante de Venta Finalizada</p>
          </div>
          <div class="invoice-info">
            <h2>VENTA / PEDIDO FINALIZADO</h2>
            <p><strong>N° Pedido:</strong> ${pedido.nroPedido}</p>
            <p><strong>Fecha/Hora:</strong> ${pedido.fecha}</p>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Datos del Cliente</div>
          <p><strong>Cliente:</strong> ${pedido.nombreCliente}</p>
          <p><strong>Teléfono:</strong> ${pedido.telefonoCliente || 'No especificado'}</p>
          <p><strong>Dirección de Entrega:</strong> ${pedido.direccionEntrega}</p>
          <p><strong>Camión con Grúa:</strong> ${pedido.requiereGrua === 'SI' ? 'SÍ' : 'NO'}</p>
          <p><strong>Estado:</strong> FINALIZADO</p>
        </div>

        <div class="section">
          <div class="section-title">Detalle de Productos Entregados</div>
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
              ${pedido.items.map(item => `
                <tr>
                  <td>${item.codigo}</td>
                  <td>${item.nombre}</td>
                  <td class="text-center">${item.cantidad}</td>
                  <td class="text-right">$${item.precioUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                  <td class="text-right">$${(item.precioUnitario * item.cantidad).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="text-align: right; margin-top: 15px; font-size: 16px;">
          <strong>Monto Total Facturado: $${pedido.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong>
        </div>

        <div class="footer">
          <div class="signature-box">Firma y Aclaración (Caja / Administración)</div>
          <div class="signature-box">Firma del Cliente</div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `;

    ventanaImpresion.document.write(contenidoHtml);
    ventanaImpresion.document.close();
  };

  // Fecha actual en formato YYYY-MM-DD para el cierre de caja diario del operador
  const hoyStr = new Date().toISOString().split('T')[0];

  const pedidosFiltrados = montado ? pedidos.filter(p => {
    const esFinalizado = p.estado?.toLowerCase() === 'entregado' || p.estado?.toLowerCase() === 'finalizado';
    const coincideTexto = 
      (p.nombreCliente || '').toLowerCase().includes(busqueda.toLowerCase()) || 
      (p.nroPedido || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.direccionEntrega || '').toLowerCase().includes(busqueda.toLowerCase());

    // Si es operador, filtramos estrictamente solo las ventas cuya fecha sea el día de hoy
    const esDelDia = rolUsuario === 'operador' ? (p.fecha === hoyStr) : true;

    return esFinalizado && coincideTexto && esDelDia;
  }) : [];

  const montoTotalVentas = pedidosFiltrados.reduce((acc, p) => acc + p.total, 0);

  return (
    <div className="space-y-6">
      {/* Header del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-500" />
            {rolUsuario === 'operador' ? 'Cierre de Caja Diario (Ventas de Hoy)' : 'Historial de Ventas y Facturación'}
          </h1>
          <p className="text-slate-400 mt-1">
            {rolUsuario === 'operador' 
              ? 'Control de operaciones realizadas en la jornada actual. Se reinicia automáticamente cada día.'
              : 'Registro y control de todas las operaciones y pedidos completados exitosamente.'
            }
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-4 shadow-md">
          <div className="text-xs text-slate-400 whitespace-nowrap">
            {rolUsuario === 'operador' ? 'Ventas hoy:' : 'Total finalizadas:'} <strong className="text-emerald-400 font-mono">{montado ? pedidosFiltrados.length : 0}</strong>
          </div>
          <div className="h-4 w-px bg-slate-800"></div>
          <div className="text-xs text-slate-400 whitespace-nowrap">
            {rolUsuario === 'operador' ? 'Total Vendido Hoy (Caja):' : 'Facturación Total:'} <strong className="text-emerald-400 font-mono">${montado ? montoTotalVentas.toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0,00'}</strong>
          </div>
        </div>
      </div>

      {/* BARRA DE BÚSQUEDA */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por número de pedido, cliente o dirección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* TABLA DE VENTAS */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">N° Pedido / Fecha</th>
                <th className="px-6 py-4">Cliente y Dirección</th>
                <th className="px-6 py-4 text-center">Camión con Grúa</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-right">Monto Total</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {!montado ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Cargando ventas...
                  </td>
                </tr>
              ) : pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map((ped) => (
                  <tr key={ped.nroPedido} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono font-bold text-emerald-400">{ped.nroPedido}</div>
                      <div className="text-xs text-slate-400">{ped.fecha}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-100">{ped.nombreCliente}</div>
                      <div className="text-xs text-slate-400">{ped.direccionEntrega} {ped.telefonoCliente && `• Tel: ${ped.telefonoCliente}`}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${
                        ped.requiereGrua === 'SI' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        <Truck className="w-3.5 h-3.5" />
                        {ped.requiereGrua === 'SI' ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {ped.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-100">
                      ${ped.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setPedidoSeleccionado(ped);
                            setModalDetalleAbierto(true);
                          }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 cursor-pointer"
                          title="Ver Detalle de Venta"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleImprimirRemito(ped)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 rounded-lg transition-colors border border-slate-700 cursor-pointer"
                          title="Imprimir Comprobante"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    {rolUsuario === 'operador' 
                      ? 'No hay ventas registradas en el día de hoy para el cierre de caja.' 
                      : 'No hay ventas finalizadas registradas todavía.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE DE VENTA */}
      {modalDetalleAbierto && pedidoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-emerald-500" />
                  Detalle de Venta: {pedidoSeleccionado.nroPedido}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Cliente: <strong className="text-slate-200">{pedidoSeleccionado.nombreCliente}</strong> ({pedidoSeleccionado.direccionEntrega})</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleImprimirRemito(pedidoSeleccionado)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-semibold rounded-lg transition-colors border border-slate-700 cursor-pointer"
                  title="Imprimir Comprobante"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Comprobante
                </button>
                <button onClick={() => setModalDetalleAbierto(false)} className="text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400">Grúa:</span> <strong className="text-emerald-400 uppercase">{pedidoSeleccionado.requiereGrua}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Estado:</span> <strong className="text-emerald-400 uppercase">{pedidoSeleccionado.estado}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Total Facturado:</span> <strong className="text-slate-100 font-mono">${pedidoSeleccionado.total.toLocaleString('es-AR')}</strong>
                </div>
              </div>

              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Productos Facturados en esta Venta</h3>

              <div className="space-y-2">
                {pedidoSeleccionado.items.map((item) => (
                  <div key={item.productoId || item.codigo} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-100 text-sm">{item.nombre} <span className="text-xs font-mono text-slate-400">({item.codigo})</span></div>
                      <div className="text-xs text-slate-400">Cantidad: <strong className="text-slate-200">{item.cantidad} un.</strong> • Subtotal: <strong className="text-emerald-400">${(item.precioUnitario * item.cantidad).toLocaleString('es-AR')}</strong></div>
                    </div>
                    <div>
                      <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md text-xs font-semibold uppercase">
                        {item.cantidad} un.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}