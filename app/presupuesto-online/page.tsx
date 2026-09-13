'use client';

import { useState } from 'react';
import { Calculator, RefreshCw, Trash2, CheckSquare, Square, ShieldCheck } from 'lucide-react';

export default function AsesorDeObrasPage() {
  // Estados de medidas y parámetros
  const [ancho, setAncho] = useState<number>(0);
  const [largo, setLargo] = useState<number>(0);
  const [plantas, setPlantas] = useState<number>(0);
  const [fase, setFase] = useState<'completa' | 'etapa1' | 'etapa2'>('completa');
  const [merca, setMerca] = useState<number>(0); // 0%, 5%, 10%

  // Componentes a incluir
  const [componentes, setComponentes] = useState({
    estructura: false,
    muros: true,
    techo: true,
    revoques: false,
    cimentacion: false,
    electricidad: false,
  });

  const [tipoLadrillo, setTipoLadrillo] = useState('Hueco 12');
  const [tipoTecho, setTipoTecho] = useState<'losa' | 'chapa'>('losa');
  const [resultadoCalculado, setResultadoCalculado] = useState(false);

  // Materiales calculados y explicaciones
  const [materiales, setMateriales] = useState<any[]>([]);
  const [explicaciones, setExplicaciones] = useState<any[]>([]);

  // 3. Botón Borrar Todo (Limpia inputs, componentes y resultados al instante)
  const borrarTodo = () => {
    setAncho(5);
    setLargo(10);
    setPlantas(1);
    setFase('completa');
    setMerca(0);
    setComponentes({
      estructura: false,
      muros: false,
      techo: false,
      revoques: false,
      cimentacion: false,
      electricidad: false,
    });
    setMateriales([]);
    setExplicaciones([]);
    setResultadoCalculado(false);
  };

  const calcularObra = () => {
    const areaPlanta = ancho * largo;
    const areaTotal = areaPlanta * plantas;
    const perimetro = (ancho + largo) * 2 * plantas;
    const listaMateriales: any[] = [];
    const listaExplicaciones: any[] = [];
    const factorMerca = 1 + merca / 100;

    // 1. Muros
    if (componentes.muros) {
      const cantidadLadrillos = Math.round(areaTotal * 12.5 * factorMerca);
      const bolsasCementoMuros = Math.round(areaTotal * 0.35 * factorMerca);
      const precioLadrilloUnit = tipoLadrillo.includes('12') ? 4500 : 5800;
      const totalLadrillos = cantidadLadrillos * precioLadrilloUnit;
      const totalCementoMuros = bolsasCementoMuros * 9500;

      listaMateriales.push(
        { nombre: `Ladrillo (${tipoLadrillo})`, cantidad: `${cantidadLadrillos} unidades`, precio: totalLadrillos },
        { nombre: 'Cemento (para Muros)', cantidad: `${bolsasCementoMuros} bolsas`, precio: totalCementoMuros }
      );

      listaExplicaciones.push({
        titulo: 'Muros y Elevación',
        texto: `• Se estiman ${cantidadLadrillos} unidades de ladrillo considerando una superficie total de muros de ${Math.round(areaTotal * 2.8)} m² (altura estándar de 2.8m) con un margen de merma del ${merca}%.\n• Se incluyen ${bolsasCementoMuros} bolsas de cemento para las mezclas de asiento y elevación.`
      });
    }

    // 2. Techo (Losa o Chapa) - CORREGIDO CON CÁLCULOS TÉCNICOS
    if (componentes.techo) {
      if (tipoTecho === 'losa') {
        // Cálculo correcto de Viguetas (separación cada 0.60m)
        const lineasViguetas = Math.ceil(ancho / 0.60);
        const metrosViguetas = Math.round(lineasViguetas * largo * factorMerca);
        
        // Ladrillos de Telgopor (sapo) para losa (aprox 3 unidades por m² de losa)
        const cantidadLadrillosSapo = Math.round(areaPlanta * 3 * factorMerca);
        
        // Malla Sima (paneles estándar de 2x3m = 6m²)
        const m2Sima = Math.round(areaPlanta * factorMerca);
        const panelesMalla = Math.ceil(m2Sima / 6);

        // Hormigón para capa de compresión (5cm de espesor promedio)
        const cementoLosa = Math.round(areaPlanta * 0.22 * factorMerca);
        const arenaM3 = Number((areaPlanta * 0.045).toFixed(1));
        const piedraM3 = Number((areaPlanta * 0.055).toFixed(1));

        listaMateriales.push(
          { nombre: 'Viguetas premoldeadas', cantidad: `${metrosViguetas} metros lineales`, precio: metrosViguetas * 8500 },
          { nombre: 'Ladrillos de Telgopor (Sapo)', cantidad: `${cantidadLadrillosSapo} unidades`, precio: cantidadLadrillosSapo * 1800 },
          { nombre: 'Malla Sima 15x15 4mm', cantidad: `${panelesMalla} paneles`, precio: panelesMalla * 22000 },
          { nombre: 'Cemento (Capa Compresión)', cantidad: `${cementoLosa} bolsas`, precio: cementoLosa * 9500 },
          { nombre: 'Arena (Hormigón Losa)', cantidad: `${arenaM3} m³`, precio: arenaM3 * 45000 },
          { nombre: 'Piedra partida (Hormigón Losa)', cantidad: `${piedraM3} m³`, precio: piedraM3 * 52000 }
        );

        listaExplicaciones.push({
          titulo: 'Techo de Losa Alivianada',
          texto: `• Viguetas: Son ${metrosViguetas} metros en total, porque las viguetas van dispuestas cada 60 cm (${ancho}m de ancho dividido 0.60m da ${lineasViguetas} líneas de viguetas a lo largo de ${largo}m).\n• Ladrillos de Telgopor: ${cantidadLadrillosSapo} unidades para rellenar el alivianamiento en los ${areaPlanta} m² de losa.\n• Capa de Compresión: Se calculan ${panelesMalla} paneles de malla sima, junto a ${cementoLosa} bolsas de cemento, ${arenaM3} m³ de arena y ${piedraM3} m³ de piedra para el hormigón vertido.`
        });
      } else {
        const m2Chapa = Math.round(areaPlanta * 1.15);
        const perfilesC = Math.round(perimetro * 0.6);
        listaMateriales.push(
          { nombre: 'Chapas Trapezoidales', cantidad: `${m2Chapa} m²`, precio: m2Chapa * 15000 },
          { nombre: 'Perfiles C (Estructura Techo)', cantidad: `${perfilesC} metros`, precio: perfilesC * 12000 }
        );

        listaExplicaciones.push({
          titulo: 'Techo de Chapa',
          texto: `• Se calculan ${m2Chapa} m² de chapa considerando excedentes por pendientes y aleros.\n• Se estiman ${perfilesC} metros lineales de perfiles C para la estructura metálica de soporte.`
        });
      }
    }

    // 3. Estructura y Cimentación
    if (componentes.estructura || componentes.cimentacion) {
      const hierroKg = Math.round(areaTotal * 18 * factorMerca);
      const cementoStruct = Math.round(areaTotal * 0.4 * factorMerca);
      listaMateriales.push(
        { nombre: 'Hierro Estructural (8mm y 12mm)', cantidad: `${hierroKg} kg`, precio: hierroKg * 3400 },
        { nombre: 'Cemento (Estructura/Bases)', cantidad: `${cementoStruct} bolsas`, precio: cementoStruct * 9500 }
      );

      listaExplicaciones.push({
        titulo: 'Estructura y Cimentación',
        texto: `• Se requieren ${hierroKg} kg de hierro para armadura de columnas, vigas y zapatas.\n• Se contemplan ${cementoStruct} bolsas de cemento para las bases y hormigón estructural.`
      });
    }

    setMateriales(listaMateriales);
    setExplicaciones(listaExplicaciones);
    setResultadoCalculado(true);
  };

  return (
    <div className="p-6 text-slate-100 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. TÍTULO CORREGIDO */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-4 gap-4">
        <div>
          <span className="text-xs font-mono text-amber-500 uppercase tracking-widest block">Asistente Integral de Construcción</span>
          <h1 className="text-2xl font-black text-white">Asesor de Obras</h1>
        </div>
        {/* 3. BOTONES DE ACTUALIZAR Y BORRAR TODO */}
        <div className="flex items-center gap-2">
          <button onClick={borrarTodo} className="bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all">
            <Trash2 className="w-4 h-4" /> Borrar Todo
          </button>
          <button onClick={calcularObra} className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-lg">
            <RefreshCw className="w-4 h-4" /> Actualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: CONFIGURADOR */}
        <div className="lg:col-span-6 space-y-6 bg-slate-900/60 p-6 rounded-3xl border border-slate-800">
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ancho (m)</label>
              <input type="number" value={ancho} onChange={(e) => setAncho(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Largo (m)</label>
              <input type="number" value={largo} onChange={(e) => setLargo(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Plantas</label>
              <input type="number" value={plantas} onChange={(e) => setPlantas(Number(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-mono">Fase Financiera de Compra</label>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => setFase('completa')} className={`py-2 rounded-xl text-xs font-bold border ${fase === 'completa' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>Obra Completa</button>
              <button onClick={() => setFase('etapa1')} className={`py-2 rounded-xl text-xs font-bold border ${fase === 'etapa1' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>Etapa 1 (Grusa)</button>
              <button onClick={() => setFase('etapa2')} className={`py-2 rounded-xl text-xs font-bold border ${fase === 'etapa2' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>Etapa 2 (Term.)</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-mono">Margen de Desperdicio (Merma)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 5, 10].map((m) => (
                <button key={m} onClick={() => setMerca(m)} className={`py-2 rounded-xl text-xs font-bold border ${merca === m ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>
                  {m === 0 ? 'Exacto (0%)' : `+${m}%`}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-mono">¿Qué componentes incluir?</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(componentes).map((key) => {
                const activo = (componentes as any)[key];
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setComponentes({ ...componentes, [key]: !activo });
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${activo ? 'bg-amber-500/10 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                  >
                    {activo ? <CheckSquare className="w-5 h-5 text-amber-500" /> : <Square className="w-5 h-5 text-slate-600" />}
                    <span className="text-xs font-bold uppercase">{key}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {componentes.techo && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs text-slate-400 uppercase tracking-wider font-mono">Tipo de Techo</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setTipoTecho('losa')} className={`py-2 rounded-xl text-xs font-bold border ${tipoTecho === 'losa' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>Losa</button>
                <button onClick={() => setTipoTecho('chapa')} className={`py-2 rounded-xl text-xs font-bold border ${tipoTecho === 'chapa' ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-950 text-slate-300 border-slate-800'}`}>Chapa</button>
              </div>
            </div>
          )}

          <button onClick={calcularObra} className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-4 rounded-2xl transition-all shadow-xl cursor-pointer flex items-center justify-center gap-2">
            <Calculator className="w-5 h-5" /> Calcular Presupuesto y Materiales
          </button>

        </div>

        {/* PANEL DERECHO: RESULTADOS Y EXPLICACIONES DINÁMICAS */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-slate-900/60 p-6 rounded-3xl border border-slate-800 min-h-[500px] flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <span className="text-xs font-mono text-amber-500 uppercase">Cotización en Tiempo Real</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  Total Estimado: ${materiales.reduce((acc, item) => acc + item.precio, 0).toLocaleString('es-AR')}
                </span>
              </div>

              {!resultadoCalculado ? (
                <div className="text-center py-24 text-slate-500 space-y-3">
                  <Calculator className="w-12 h-12 mx-auto text-slate-700" />
                  <p className="text-sm">Configura los parámetros y presiona calcular para ver el detalle y explicaciones.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Materiales Requeridos</h3>
                    {materiales.map((mat, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800/80 p-4 rounded-2xl flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{mat.nombre}</p>
                          <span className="text-xs text-amber-500 font-mono">{mat.cantidad}</span>
                        </div>
                        <span className="text-sm font-mono font-bold text-slate-200">${mat.precio.toLocaleString('es-AR')}</span>
                      </div>
                    ))}
                  </div>

                  {/* 4. Explicaciones dinámicas estrictamente de lo seleccionado */}
                  <div className="pt-6 border-t border-slate-800 space-y-3">
                    <h3 className="text-xs font-mono uppercase text-amber-500 tracking-wider flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Explicación de Cálculos
                    </h3>
                    {explicaciones.map((exp, idx) => (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-1">
                        <p className="text-xs font-bold text-white">{exp.titulo}</p>
                        <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{exp.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center pt-6 text-[10px] text-slate-600 font-mono border-t border-slate-800/60 mt-6">
              Módulo Asesor de Obras • Corralón
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}