'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { Calculator, CheckCircle, HardHat, AlertCircle, MessageCircle, DollarSign, Percent, BookOpen, Truck, Clock, Layers, Building2 } from 'lucide-react';
import { useInventario } from '@/context/InventarioContext';
import { useSearchParams } from 'next/navigation';

function PresupuestoOnlineContent() {
  const inventarioContext = useInventario() as any;
  const productos = inventarioContext?.productos || [];

  const searchParams = useSearchParams();

  // Parámetros leídos de la URL o valores por defecto
  const [nombreCliente, setNombreCliente] = useState<string>('');
  const [ancho, setAncho] = useState<number>(5);
  const [largo, setLargo] = useState<number>(10);
  const [plantas, setPlantas] = useState<number>(1);
  const [margenDesperdicio, setMargenDesperdicio] = useState<number>(0);
  
  const [tipoLadrillo, setTipoLadrillo] = useState<'hueco12' | 'hueco18' | 'comun' | 'portante'>('hueco12');
  const [tipoTecho, setTipoTecho] = useState<'losa' | 'chapa'>('losa');
  const [faseCompra, setFaseCompra] = useState<'todas' | 'etapa1' | 'etapa2'>('todas');
  
  const [incluirEstructura, setIncluirEstructura] = useState(true);
  const [incluirMuros, setIncluirMuros] = useState(true);
  const [incluirTecho, setIncluirTecho] = useState(true);
  const [incluirRevoques, setIncluirRevoques] = useState(true);
  const [incluirPlomeria, setIncluirPlomeria] = useState(true);
  const [incluirElectricidad, setIncluirElectricidad] = useState(true);

  const [vistaActiva, setVistaActiva] = useState<'cotizacion' | 'explicacion' | 'logistica'>('cotizacion');

  useEffect(() => {
    if (!searchParams) return;
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

    const listaFiltradaPorFase = listaGenerica.filter(item => {
      if (faseCompra === 'etapa1') return item.fase === 'etapa1';
      if (faseCompra === 'etapa2') return item.fase === 'etapa2';
      return true;
    });

    return listaFiltradaPorFase.map(mat => {
      const terminos = mat.terminosBúsqueda.toLowerCase().split(' ');
      const prodEncontrado = productos?.find((p: any) => terminos.every(t => p.nombre.toLowerCase().includes(t)));
      
      const precioU = prodEncontrado ? Number(prodEncontrado.precio) : 0;
      
      return {
        ...mat,
        nombre: prodEncontrado ? prodEncontrado.nombre : mat.nombre,
        precioUnitario: precioU,
        subtotal: precioU * mat.cantidad,
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
      { titulo: '🏗️ Cimientos y Estructura', texto: `Para un perímetro de ${perimetro} metros y ${cantColumnas} columnas, se calcula el hormigón para zapatas y vigas con margen de seguridad.` },
      { titulo: '🧱 Muros y Paredes', texto: `Perímetro por altura descontando un 20% de aberturas, adaptado al rendimiento del ladrillo elegido.` },
      { titulo: '🏠 Techo / Cubierta', texto: tipoTecho === 'losa' ? `Para ${areaPlanta} m², incluye bloques, malla sima y capa de compresión.` : `Para techo de chapa, incluye chapas con solapes y perfiles estructurales.` },
      { titulo: '🎨 Revoques y Terminaciones', texto: `Superficie de paredes internas y externas por duplicado para estimar cemento, cal e impermeabilizantes.` },
      { titulo: '🔧 Plomería y Electricidad', texto: `Proporcional a los metros cuadrados y lineales para instalaciones básicas.` }
    ];
  };

  const explicaciones = generarExplicacionTecnica();

  const contactarPorWhatsApp = () => {
    const mensaje = encodeURIComponent(`Hola! Estuve viendo el presupuesto online para la obra de ${ancho}x${largo}m (${plantas} planta/s) por un total aproximado de $${totalPresupuesto.toLocaleString('es-AR')}. Me gustaría coordinar para avanzar.`);
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-10">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header Público */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-wider">Corralón Oficial</span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">Cotizador Online Interactivos</h1>
            </div>
          </div>
          <div className="text-right sm:text-right w-full sm:w-auto">
            <span className="text-xs text-slate-400 block">Cliente / Proyecto:</span>
            <span className="text-sm font-bold text-amber-400">{nombreCliente || 'Obra General'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Controles de Simulación para el Cliente */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4" /> Medidas y Opciones de Tu Proyecto
            </h2>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Ancho (m)</label>
                <input type="number" value={ancho} onChange={(e) => setAncho(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Largo (m)</label>
                <input type="number" value={largo} onChange={(e) => setLargo(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Plantas</label>
                <input type="number" value={plantas} onChange={(e) => setPlantas(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">Fase Financiera</label>
              <div className="grid grid-cols-3 gap-1">
                <button onClick={() => setFaseCompra('todas')} className={`p-2 rounded-lg text-[10px] font-bold border ${faseCompra === 'todas' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>Completa</button>
                <button onClick={() => setFaseCompra('etapa1')} className={`p-2 rounded-lg text-[10px] font-bold border ${faseCompra === 'etapa1' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>Etapa 1</button>
                <button onClick={() => setFaseCompra('etapa2')} className={`p-2 rounded-lg text-[10px] font-bold border ${faseCompra === 'etapa2' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>Etapa 2</button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300">Margen de Seguridad (Merma)</label>
              <div className="grid grid-cols-3 gap-1">
                {[0, 5, 10].map(val => (
                  <button key={val} onClick={() => setMargenDesperdicio(val)} className={`p-2 rounded-lg text-[10px] font-bold border ${margenDesperdicio === val ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-400 border-slate-800'}`}>
                    {val === 0 ? '0%' : `+${val}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultado de la Cotización Pública */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              
              <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center justify-between text-[11px] text-amber-400">
                <span className="flex items-center gap-1.5 font-medium"><Clock className="w-3.5 h-3.5"/> Validez del Presupuesto: 7 días corridos</span>
                <span className="font-mono bg-amber-500/20 px-2 py-0.5 rounded text-[10px]">Online</span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex gap-1.5">
                  <button onClick={() => setVistaActiva('cotizacion')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${vistaActiva === 'cotizacion' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400'}`}>Cotización (${totalPresupuesto.toLocaleString('es-AR')})</button>
                  <button onClick={() => setVistaActiva('explicacion')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${vistaActiva === 'explicacion' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400'}`}>Explicación</button>
                  <button onClick={() => setVistaActiva('logistica')} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${vistaActiva === 'logistica' ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400'}`}>Logística</button>
                </div>
              </div>

              {vistaActiva === 'cotizacion' && (
                <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                  {materialesCalculados.map((item, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="text-xs font-medium text-slate-200 block">{item.nombre}</span>
                        <span className="text-[9px] font-mono text-amber-500 uppercase">{item.categoria}</span>
                      </div>
                      <div className="text-right">
                        <span className="block text-xs font-mono font-bold text-amber-400">{item.cantidad} {item.unidad}</span>
                        <span className="text-[10px] text-slate-400">${item.subtotal.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {vistaActiva === 'explicacion' && (
                <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                  {explicaciones.map((exp, idx) => (
                    <div key={idx} className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-0.5">
                      <h4 className="text-xs font-bold text-amber-400">{exp.titulo}</h4>
                      <p className="text-[11px] text-slate-300">{exp.texto}</p>
                    </div>
                  ))}
                </div>
              )}

              {vistaActiva === 'logistica' && (
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs text-slate-300">
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span>Bolsas de Cemento:</span>
                    <span className="font-mono text-amber-400 font-bold">{logistica.totalBolsasCemento}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800 pb-2">
                    <span>Áridos (Arena/Piedra):</span>
                    <span className="font-mono text-amber-400 font-bold">{logistica.totalM3Aridos} m³</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Camión con Grúa requerido:</span>
                    <span className="font-mono text-amber-400 font-bold">{logistica.requiereGrúa ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              )}

            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={contactarPorWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold py-3.5 rounded-xl transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" /> Consultar y Confirmar con el Corralón por WhatsApp
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PresupuestoOnlinePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-100 p-10 flex items-center justify-center">Cargando presupuesto online...</div>}>
      <PresupuestoOnlineContent />
    </Suspense>
  );
}