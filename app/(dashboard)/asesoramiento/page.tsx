'use client';
export const dynamic = 'force-dynamic'; // <--- Evita el error de prerenderizado en Vercel
import { useState, useEffect } from 'react';
import { Calculator, ShoppingCart, CheckCircle, ArrowRight, HardHat, AlertCircle, MessageCircle, DollarSign, Percent, BookOpen, FileText, Truck, Save, Share2, Clock, Layers } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AsesoriasPage() {
  const { productos, registrarPedido } = useInventario() as any;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [nombreCliente, setNombreCliente] = useState<string>('');
  const [telefonoCliente, setTelefonoCliente] = useState<string>('');
  
  // Parámetros leídos o configurados
  const [ancho, setAncho] = useState<number>(5);
  const [largo, setLargo] = useState<number>(10);
  const [plantas, setPlantas] = useState<number>(1);
  const [margenDesperdicio, setMargenDesperdicio] = useState<number>(0);
  
  const [tipoLadrillo, setTipoLadrillo] = useState<'hueco12' | 'hueco18' | 'comun' | 'portante'>('hueco12');
  const [tipoTecho, setTipoTecho] = useState<'losa' | 'chapa'>('losa');
  
  // Etapa Financiera / Fase de Compra
  const [faseCompra, setFaseCompra] = useState<'todas' | 'etapa1' | 'etapa2'>('todas');
  
  // Etapas constructivas
  const [incluirEstructura, setIncluirEstructura] = useState(true);
  const [incluirMuros, setIncluirMuros] = useState(true);
  const [incluirTecho, setIncluirTecho] = useState(true);
  const [incluirRevoques, setIncluirRevoques] = useState(true);
  const [incluirPlomeria, setIncluirPlomeria] = useState(true);
  const [incluirElectricidad, setIncluirElectricidad] = useState(true);

  // Pestañas activas y estados
  const [vistaActiva, setVistaActiva] = useState<'cotizacion' | 'explicacion' | 'logistica'>('cotizacion');
  const [exitoGuardado, setExitoGuardado] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  // Sincronizar parámetros si se abre mediante URL compartida
  useEffect(() => {
    const a = searchParams.get('ancho');
    const l = searchParams.get('largo');
    const p = searchParams.get('plantas');
    const m = searchParams.get('merma');
    const cli = searchParams.get('cliente');

    if (a) setAncho(Number(a));
    if (l) setLargo(Number(l));
    if (p) setPlantas(Number(p));
    if (m) setMargenDesperdicio(Number(m));
    if (cli) setNombreCliente(cli);
  }, [searchParams]);

  const aplicarMerma = (cantidad: number) => Math.ceil(cantidad * (1 + margenDesperdicio / 100));

  const calcularMaterialesCompleto = () => {
    const areaPlanta = ancho * largo;
    const areaTotalConstruida = areaPlanta * plantas;
    const perimetro = (ancho + largo) * 2;
    const alturaPlanta = 2.7;
    const alturaTotal = alturaPlanta * plantas;
    const m2Paredes = perimetro * alturaTotal * 0.8;

    let listaGenerica: { nombre: string; cantidad: number; unidad: string; categoria: string; fase: 'etapa1' | 'etapa2'; terminosBúsqueda: string }[] = [];

    // FASE 1: Obra Gruesa (Estructura, Muros, Techo)
    if (incluirEstructura) {
      const mlVigasFundacion = perimetro;
      const cantColumnas = Math.max(4, Math.ceil(perimetro / 4) * plantas);
      const volHormigon = (mlVigasFundacion * 0.2 * 0.3) + (cantColumnas * 0.8 * 0.4 * 0.4);
      
      listaGenerica.push(
        { nombre: 'Cemento Loma negra 25k', cantidad: aplicarMerma(volHormigon * 7.5), unidad: 'bolsas', categoria: 'Estructura', fase: 'etapa1', terminosBúsqueda: 'cemento loma negra' },
        { nombre: 'Arena X MT SUELTA', cantidad: Number((volHormigon * 0.55 * (1 + margenDesperdicio / 100)).toFixed(2)), unidad: 'm³', categoria: 'Estructura', fase: 'etapa1', terminosBúsqueda: 'arena x mt suelta' },
        { nombre: 'PIEDRA X MT SUELTA', cantidad: Number((volHormigon * 0.75 * (1 + margenDesperdicio / 100)).toFixed(2)), unidad: 'm³', categoria: 'Estructura', fase: 'etapa1', terminosBúsqueda: 'piedra x mt suelta' },
        { nombre: 'varilla 10 mm (ACINDAR)', cantidad: aplicarMerma((cantColumnas * 3 * plantas) + (mlVigasFundacion * 1.5)), unidad: 'varillas', categoria: 'Estructura', fase: 'etapa1', terminosBúsqueda: 'varilla 10 mm' },
        { nombre: 'Varilla 8mm (ACINDAR)', cantidad: aplicarMerma(mlVigasFundacion * 3 + cantColumnas * 4), unidad: 'varillas', categoria: 'Estructura', fase: 'etapa1', terminosBúsqueda: 'varilla 8mm' }
      );
    }

    if (incluirMuros) {
      let rendimientoLadrillo = 30;
      if (tipoLadrillo === 'hueco18') rendimientoLadrillo = 25;
      if (tipoLadrillo === 'comun') rendimientoLadrillo = 60;
      if (tipoLadrillo === 'portante') rendimientoLadrillo = 22;

      let nombreLadrilloStr = 'Ladrillos huecos 12x95';
      let terminosLadrillo = 'ladrillos huecos 12';
      if (tipoLadrillo === 'hueco18') { nombreLadrilloStr = 'Ladrillos huecos 8396'; terminosLadrillo = 'ladrillos huecos'; }
      if (tipoLadrillo === 'comun') { nombreLadrilloStr = 'Ladrillos comunes'; terminosLadrillo = 'ladrillos comunes'; }
      if (tipoLadrillo === 'portante') { nombreLadrilloStr = 'Ladrillos huecos 12x62'; terminosLadrillo = 'ladrillos huecos 12'; }

      listaGenerica.push(
        { nombre: nombreLadrilloStr, cantidad: aplicarMerma(m2Paredes * rendimientoLadrillo), unidad: 'unidades', categoria: 'Muros', fase: 'etapa1', terminosBúsqueda: terminosLadrillo },
        { nombre: 'Cemento Loma negra 25k', cantidad: aplicarMerma(m2Paredes * 0.12), unidad: 'bolsas', categoria: 'Muros', fase: 'etapa1', terminosBúsqueda: 'cemento loma negra' },
        { nombre: 'Cal Cacique 25k', cantidad: aplicarMerma(m2Paredes * 0.10), unidad: 'bolsas', categoria: 'Muros', fase: 'etapa1', terminosBúsqueda: 'cal cacique' },
        { nombre: 'Arena X MT SUELTA', cantidad: Number((m2Paredes * 0.018 * (1 + margenDesperdicio / 100)).toFixed(2)), unidad: 'm³', categoria: 'Muros', fase: 'etapa1', terminosBúsqueda: 'arena x mt suelta' }
      );
    }

    if (incluirTecho) {
      if (tipoTecho === 'losa') {
        listaGenerica.push(
          { nombre: 'LADRILLO TELGOPOR 12 CM', cantidad: aplicarMerma(areaPlanta * 7.5), unidad: 'unidades', categoria: 'Techo', fase: 'etapa1', terminosBúsqueda: 'ladrillo telgopor 12' },
          { nombre: 'MALLA 15X15 4 MM (2X5)', cantidad: aplicarMerma(areaPlanta / 10), unidad: 'paneles', categoria: 'Techo', fase: 'etapa1', terminosBúsqueda: 'malla 15x15' },
          { nombre: 'Cemento Loma negra 25k', cantidad: aplicarMerma(areaPlanta * 0.35 * 7), unidad: 'bolsas', categoria: 'Techo', fase: 'etapa1', terminosBúsqueda: 'cemento loma negra' }
        );
      } else {
        listaGenerica.push(
          { nombre: 'PIEDRA X MT SUELTA', cantidad: aplicarMerma(largo * 1.2), unidad: 'unidades', categoria: 'Techo', fase: 'etapa1', terminosBúsqueda: 'piedra' },
          { nombre: 'Arena X MT SUELTA', cantidad: aplicarMerma(ancho * 3), unidad: 'm³', categoria: 'Techo', fase: 'etapa1', terminosBúsqueda: 'arena' }
        );
      }
    }

    // FASE 2: Terminaciones e Instalaciones (Revoques, Plomería, Electricidad)
    if (incluirRevoques) {
      const m2Revoque = m2Paredes * 2;
      listaGenerica.push(
        { nombre: 'Cemento Loma negra 25k', cantidad: aplicarMerma(m2Revoque * 0.08), unidad: 'bolsas', categoria: 'Terminaciones', fase: 'etapa2', terminosBúsqueda: 'cemento loma negra' },
        { nombre: 'Cal Cacique 25k', cantidad: aplicarMerma(m2Revoque * 0.12), unidad: 'bolsas', categoria: 'Terminaciones', fase: 'etapa2', terminosBúsqueda: 'cal cacique' },
        { nombre: 'TACURU 4 Its.', cantidad: aplicarMerma(m2Revoque * 0.3), unidad: 'litros', categoria: 'Terminaciones', fase: 'etapa2', terminosBúsqueda: 'tacuru' }
      );
    }

    if (incluirPlomeria) {
      listaGenerica.push(
        { nombre: 'MANGUERA CRISTAL 9 x 12 mm', cantidad: aplicarMerma(perimetro * 1.5), unidad: 'metros', categoria: 'Plomería', fase: 'etapa2', terminosBúsqueda: 'manguera cristal' }
      );
    }

    if (incluirElectricidad) {
      listaGenerica.push(
        { nombre: 'MANGUERA CRISTAL 9 x 12 mm', cantidad: aplicarMerma(areaTotalConstruida * 3.5), unidad: 'metros', categoria: 'Electricidad', fase: 'etapa2', terminosBúsqueda: 'manguera cristal' }
      );
    }

    // Filtrar según la fase financiera seleccionada
    const listaFiltradaPorFase = listaGenerica.filter(item => {
      if (faseCompra === 'etapa1') return item.fase === 'etapa1';
      if (faseCompra === 'etapa2') return item.fase === 'etapa2';
      return true; // 'todas'
    });

    return listaFiltradaPorFase.map(mat => {
      const terminos = mat.terminosBúsqueda.toLowerCase().split(' ');
      const prodEncontrado = productos.find((p: any) => terminos.every(t => p.nombre.toLowerCase().includes(t)));
      
      const precioU = prodEncontrado ? Number(prodEncontrado.precio) : 0;
      const stockDisp = prodEncontrado ? Number(prodEncontrado.stockActual) : 0;
      
      return {
        ...mat,
        nombre: prodEncontrado ? prodEncontrado.nombre : mat.nombre,
        productoId: prodEncontrado ? prodEncontrado.id : 'PROD-GEN',
        codigo: prodEncontrado ? prodEncontrado.codigo : 'GEN-01',
        precioUnitario: precioU,
        subtotal: precioU * mat.cantidad,
        stockActual: stockDisp,
        hayStock: stockDisp >= mat.cantidad
      };
    });
  };

  const materialesCalculados = calcularMaterialesCompleto();
  const totalPresupuesto = materialesCalculados.reduce((acc, item) => acc + item.subtotal, 0);

  const calcularLogistica = () => {
    const totalBolsasCemento = materialesCalculados
      .filter(i => i.nombre.toLowerCase().includes('cemento'))
      .reduce((acc, i) => acc + i.cantidad, 0);

    const totalM3Aridos = materialesCalculados
      .filter(i => i.unidad === 'm³')
      .reduce((acc, i) => acc + i.cantidad, 0);

    const requiereGrúa = totalBolsasCemento > 80 || materialesCalculados.some(i => i.categoria === 'Estructura' && i.cantidad > 50);
    const viajesAridos = Math.ceil(totalM3Aridos / 4);

    return {
      requiereGrúa,
      totalBolsasCemento,
      totalM3Aridos,
      viajesAridos: viajesAridos === 0 ? 1 : viajesAridos
    };
  };

  const logistica = calcularLogistica();

  const generarExplicacionTecnica = () => {
    const perimetro = (ancho + largo) * 2;
    const cantColumnas = Math.max(4, Math.ceil(perimetro / 4) * plantas);
    const areaPlanta = ancho * largo;

    return [
      {
        titulo: '🏗️ Cimientos y Estructura',
        texto: `Para un perímetro de ${perimetro} metros y un estimado de ${cantColumnas} columnas, calculamos el hormigón para zapatas, vigas y columnas sumando un margen de seguridad por cortes y descarte.`
      },
      {
        titulo: '🧱 Muros y Paredes',
        texto: `Se toma el perímetro por la altura total, descontando un 20% de aberturas. Se multiplica por el rendimiento exacto del ladrillo seleccionado con sus mezclas de asiento.`
      },
      {
        titulo: '🏠 Techo / Cubierta',
        texto: tipoTecho === 'losa' 
          ? `Para ${areaPlanta} m², calculamos bloques de telgopor, malla sima y el hormigón con su cemento correspondiente.`
          : `Para techo de chapa, estimamos la cantidad de chapas con solapes y perfiles estructurales necesarios.`
      },
      {
        titulo: '🎨 Revoques y Terminaciones',
        texto: `Calculamos la superficie de paredes internas y externas por duplicado para estimar las bolsas de cemento, cal y aditivos impermeabilizantes.`
      },
      {
        titulo: '🔧 Plomería y Electricidad',
        texto: `Se calculan de forma proporcional a los metros cuadrados y lineales del proyecto para instalaciones básicas.`
      }
    ];
  };

  const explicaciones = generarExplicacionTecnica();

  // Compartir Enlace URL directo
  const compartirEnlaceURL = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const urlCompartible = `${baseUrl}?ancho=${ancho}&largo=${largo}&plantas=${plantas}&merma=${margenDesperdicio}&cliente=${encodeURIComponent(nombreCliente)}`;
    
    navigator.clipboard.writeText(urlCompartible).then(() => {
      alert('🔗 ¡Enlace interactivo copiado! Compartilo con tu cliente para que vea su presupuesto online en tiempo real.');
    });
  };

  const copiarPresupuestoWhatsApp = () => {
    let texto = `🏗️ *PRESUPUESTO ESTIMADO - CORRALÓN*\n`;
    texto += `👤 Cliente: ${nombreCliente || 'Consumidor Final'}\n`;
    texto += `📏 Obra: ${ancho}x${largo}m (${plantas} plantas)\n`;
    if (faseCompra !== 'todas') texto += `📌 Fase: ${faseCompra === 'etapa1' ? 'Etapa 1 (Obra Gruesa)' : 'Etapa 2 (Terminaciones)'}\n`;
    if (margenDesperdicio > 0) texto += `⚠️ Incluye ${margenDesperdicio}% de margen de seguridad (merma).\n`;
    texto += `\n*DETALLE DE MATERIALES:*\n`;

    let categoriaActual = '';
    materialesCalculados.forEach(item => {
      if (categoriaActual !== item.categoria) {
        texto += `\n🔹 _${item.categoria}_\n`;
        categoriaActual = item.categoria;
      }
      texto += `• ${item.cantidad} ${item.unidad} | ${item.nombre}\n`;
      if (item.precioUnitario > 0) {
        texto += `  |_ Subtotal: $${item.subtotal.toLocaleString('es-AR')}\n`;
      }
    });

    texto += `\n💰 *TOTAL ESTIMADO: $${totalPresupuesto.toLocaleString('es-AR')}*\n`;
    texto += `\n⏰ *Validez del presupuesto:* 7 días a partir de la fecha.\n`;
    texto += `\n_¡Contactanos para confirmar stock y coordinar envío!_ 🚚`;

    navigator.clipboard.writeText(texto).then(() => {
      alert('✅ ¡Presupuesto copiado al portapapeles con aviso de validez! Listo para pegar en WhatsApp.');
    });
  };

  const guardarPresupuestoHistorial = () => {
    if (!nombreCliente.trim()) {
      alert('Por favor, ingresa el nombre del cliente para guardar el presupuesto.');
      return;
    }
    registrarPedido({
      clienteId: 'CLI-PRESUPUESTO',
      nombreCliente: nombreCliente,
      telefonoCliente: telefonoCliente || 'Sin teléfono',
      direccionEntrega: `Presupuesto Obra: ${ancho}x${largo}m (${plantas} planta/s)`,
      requiereGrua: logistica.requiereGrúa ? 'SI' : 'NO',
      items: materialesCalculados,
      total: totalPresupuesto,
      estado: 'Presupuesto Guardado'
    });
    setMensajeExito('¡Presupuesto guardado en el historial con éxito!');
    setExitoGuardado(true);
    setTimeout(() => {
      setExitoGuardado(false);
      router.push('/presupuestos');
    }, 2000);
  };

  const descargarPDFPresupuesto = () => {
    if (!nombreCliente.trim()) {
      alert('Por favor, ingresa el nombre del cliente antes de descargar el PDF.');
      return;
    }
    
    const fechaActual = new Date().toLocaleDateString('es-AR');
    let contenidoVentana = `<html><head><title>Presupuesto - ${nombreCliente}</title><style>body{font-family:Arial;padding:20px;color:#111;}h1{color:#d97706;}.aviso{background:#fef3c7;border:1px solid #f59e0b;padding:10px;font-size:11px;margin-bottom:15px;}table{width:100%;border-collapse:collapse;margin-top:15px;}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left;}th{background:#f3f4f6;}</style></head><body>`;
    contenidoVentana += `<h1>CORRALÓN - PRESUPUESTO OFICIAL DE OBRA</h1>`;
    contenidoVentana += `<p><strong>Fecha de emisión:</strong> ${fechaActual} | <strong>Validez:</strong> 7 días corridos</p>`;
    contenidoVentana += `<div class="aviso"><strong>Aviso Importante:</strong> Los precios y el stock están sujetos a confirmación al momento de concretar la seña o el pago total del pedido.</div>`;
    contenidoVentana += `<p><strong>Cliente:</strong> ${nombreCliente} | <strong>Teléfono:</strong> ${telefonoCliente || 'No especificado'}</p>`;
    contenidoVentana += `<p><strong>Dimensiones:</strong> ${ancho}m x ${largo}m (${plantas} planta/s) | <strong>Merma:</strong> +${margenDesperdicio}%</p>`;
    contenidoVentana += `<table><tr><th>Categoría</th><th>Material</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr>`;
    
    materialesCalculados.forEach(item => {
      contenidoVentana += `<tr><td>${item.categoria}</td><td>${item.nombre}</td><td>${item.cantidad} ${item.unidad}</td><td>$${item.precioUnitario.toLocaleString('es-AR')}</td><td>$${item.subtotal.toLocaleString('es-AR')}</td></tr>`;
    });
    
    contenidoVentana += `</table>`;
    contenidoVentana += `<h2>Total Estimado: $${totalPresupuesto.toLocaleString('es-AR')}</h2>`;
    contenidoVentana += `<p style="font-size:10px;color:#666;margin-top:30px;">Documento generado por Asistente Inteligente de Construcción.</p></body></html>`;

    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(contenidoVentana);
      ventana.document.close();
      ventana.focus();
      setTimeout(() => ventana.print(), 500);
    }
  };

  const generarPedidoDesdeAsesoria = () => {
    if (!nombreCliente.trim()) {
      alert('Por favor, ingresa el nombre del cliente para registrar el pedido.');
      return;
    }
    registrarPedido({
      clienteId: 'CLI-ASISTENTE',
      nombreCliente: nombreCliente,
      telefonoCliente: telefonoCliente || 'Sin teléfono',
      direccionEntrega: `Proyecto Integral: ${ancho}x${largo}m (${plantas} planta/s) +${margenDesperdicio}% merma`,
      requiereGrua: logistica.requiereGrúa ? 'SI' : 'NO',
      items: materialesCalculados,
      total: totalPresupuesto,
      estado: 'Pendiente'
    });
    setMensajeExito('¡Pedido generado y enviado a gestión con éxito!');
    setExitoGuardado(true);
    setTimeout(() => router.push('/pedidos'), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-wider mb-1">
              <HardHat className="w-4 h-4" /> Asistente Integral de Construcción
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Cotizador Inteligente & Factor Diferencial</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={compartirEnlaceURL}
              className="bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-3 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              title="Copiar enlace para compartir con el cliente"
            >
              <Share2 className="w-4 h-4" /> Copiar Enlace Interactivo
            </button>
            <button onClick={() => router.push('/')} className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer">
              Volver
            </button>
          </div>
        </div>

        {exitoGuardado ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-12 rounded-2xl text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-white">{mensajeExito}</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Columna Izquierda: Configuración Técnica */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Ancho (m)</label>
                  <input type="number" value={ancho} onChange={(e) => setAncho(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Largo (m)</label>
                  <input type="number" value={largo} onChange={(e) => setLargo(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Plantas</label>
                  <input type="number" value={plantas} onChange={(e) => setPlantas(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
                </div>
              </div>

              {/* Selector de Etapa Financiera / Fase de Compra */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="block text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
                  <Layers className="w-4 h-4" /> Fase Financiera de Compra
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => setFaseCompra('todas')} className={`p-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${faseCompra === 'todas' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                    Obra Completa
                  </button>
                  <button onClick={() => setFaseCompra('etapa1')} className={`p-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${faseCompra === 'etapa1' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                    Etapa 1 (Gruesa)
                  </button>
                  <button onClick={() => setFaseCompra('etapa2')} className={`p-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${faseCompra === 'etapa2' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
                    Etapa 2 (Term.)
                  </button>
                </div>
              </div>

              {/* Control de Merma / Desperdicio */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase flex items-center gap-2 mb-3">
                  <Percent className="w-4 h-4" /> Margen de Desperdicio (Merma)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 5, 10].map(val => (
                    <button key={val} onClick={() => setMargenDesperdicio(val)} className={`p-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${margenDesperdicio === val ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900 text-slate-400 border-slate-700 hover:bg-slate-800'}`}>
                      {val === 0 ? 'Exacto (0%)' : `+${val}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector de Etapas Constructivas */}
              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">¿Qué componentes incluir?</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={incluirEstructura} onChange={(e) => setIncluirEstructura(e.target.checked)} className="accent-amber-500" />
                    Estructura
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={incluirMuros} onChange={(e) => setIncluirMuros(e.target.checked)} className="accent-amber-500" />
                    Muros
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={incluirTecho} onChange={(e) => setIncluirTecho(e.target.checked)} className="accent-amber-500" />
                    Techo
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={incluirRevoques} onChange={(e) => setIncluirRevoques(e.target.checked)} className="accent-amber-500" />
                    Revoques
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={incluirPlomeria} onChange={(e) => setIncluirPlomeria(e.target.checked)} className="accent-amber-500" />
                    Plomería
                  </label>
                  <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800 cursor-pointer">
                    <input type="checkbox" checked={incluirElectricidad} onChange={(e) => setIncluirElectricidad(e.target.checked)} className="accent-amber-500" />
                    Electricidad
                  </label>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo de Ladrillo</label>
                  <select value={tipoLadrillo} onChange={(e: any) => setTipoLadrillo(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white">
                    <option value="hueco12">Hueco 12</option>
                    <option value="hueco18">Hueco 18</option>
                    <option value="comun">Común Macizo</option>
                    <option value="portante">Portante 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Techo</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setTipoTecho('losa')} className={`p-2 rounded-xl text-xs font-bold border ${tipoTecho === 'losa' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950'}`}>Losa</button>
                    <button type="button" onClick={() => setTipoTecho('chapa')} className={`p-2 rounded-xl text-xs font-bold border ${tipoTecho === 'chapa' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950'}`}>Chapa</button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <input type="text" placeholder="Nombre del Cliente..." value={nombreCliente} onChange={(e) => setNombreCliente(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white" />
                <input type="text" placeholder="Teléfono..." value={telefonoCliente} onChange={(e) => setTelefonoCliente(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white" />
              </div>
            </div>

            {/* Columna Derecha: Pestañas + Cotización con Validez */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                
                {/* Aviso de Validez de Presupuesto */}
                <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center justify-between text-[11px] text-amber-400">
                  <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5"/> Validez del Presupuesto: 7 días corridos</span>
                  <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">Actualizado</span>
                </div>

                {/* Pestañas de Navegación de la Derecha */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 overflow-x-auto">
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVistaActiva('cotizacion')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${vistaActiva === 'cotizacion' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      <DollarSign className="w-3.5 h-3.5" /> Cotización (${totalPresupuesto.toLocaleString('es-AR')})
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaActiva('explicacion')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${vistaActiva === 'explicacion' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      <BookOpen className="w-3.5 h-3.5" /> Explicación
                    </button>
                    <button
                      type="button"
                      onClick={() => setVistaActiva('logistica')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${vistaActiva === 'logistica' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                    >
                      <Truck className="w-3.5 h-3.5" /> Logística
                    </button>
                  </div>
                </div>

                {/* Contenido según la pestaña activa */}
                {vistaActiva === 'cotizacion' && (
                  <div className="space-y-2 max-h-[310px] overflow-y-auto pr-2">
                    {materialesCalculados.map((item, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${item.hayStock ? 'bg-slate-950 border-slate-800/80' : 'bg-rose-950/20 border-rose-900/30'} flex items-center justify-between`}>
                        <div className="space-y-1">
                          <span className="text-xs font-medium text-slate-200 block">{item.nombre}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-amber-500/80 uppercase">{item.categoria}</span>
                            {item.hayStock ? (
                              <span className="text-[9px] text-emerald-400 flex items-center gap-0.5"><CheckCircle className="w-3 h-3"/> Stock OK ({item.stockActual})</span>
                            ) : (
                              <span className="text-[9px] text-rose-400 flex items-center gap-0.5"><AlertCircle className="w-3 h-3"/> Stock Insuficiente ({item.stockActual})</span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="block text-xs font-mono font-bold text-amber-400">
                            {item.cantidad} {item.unidad}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ${item.subtotal.toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {vistaActiva === 'explicacion' && (
                  <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                    <p className="text-[11px] text-slate-400 italic mb-2">
                      Memoria técnica explicada en lenguaje sencillo para transmitir seguridad al cliente:
                    </p>
                    {explicaciones.map((exp, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl space-y-1">
                        <h4 className="text-xs font-bold text-amber-400">{exp.titulo}</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">{exp.texto}</p>
                      </div>
                    ))}
                  </div>
                )}

                {vistaActiva === 'logistica' && (
                  <div className="space-y-3 max-h-[310px] overflow-y-auto pr-1">
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Estimación de Envío y Logística
                      </h4>
                      <div className="space-y-2 text-xs text-slate-300">
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span>Total bolsas de cemento estimadas:</span>
                          <span className="font-mono font-bold text-amber-400">{logistica.totalBolsasCemento} bolsas</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-800 pb-2">
                          <span>Volumen total de áridos (arena/piedra):</span>
                          <span className="font-mono font-bold text-amber-400">{logistica.totalM3Aridos} m³ (~{logistica.viajesAridos} viaje/s)</span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span>Requiere camión con grúa:</span>
                          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[10px] ${logistica.requiereGrúa ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-300'}`}>
                            {logistica.requiereGrúa ? 'SÍ (Volumen pesado)' : 'NO (Envío estándar)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Botonera de Acciones Comerciales Ampliada */}
              <div className="space-y-2 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={copiarPresupuestoWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={descargarPDFPresupuesto}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" /> Descargar PDF
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={guardarPresupuestoHistorial}
                    className="bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 text-[11px] font-bold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" /> Guardar Presupuesto
                  </button>
                  <button
                    type="button"
                    onClick={generarPedidoDesdeAsesoria}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-extrabold py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Cargar al Pedido <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}