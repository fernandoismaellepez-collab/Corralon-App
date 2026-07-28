'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Solpe, ItemSolpe, HistorialCompraProducto } from '@/types/compras';
import { useInventario } from '@/context/InventarioContext';

interface ComprasContextType {
  solpes: Solpe[];
  historialCompras: Record<string, HistorialCompraProducto>;
  agregarSolpe: (nuevaSolpe: Omit<Solpe, 'idSolpe'>) => void;
  actualizarEstadoSolpe: (idSolpe: string, nuevoEstado: Solpe['estado']) => void;
  eliminarSolpe: (idSolpe: string) => void;
}

const ComprasContext = createContext<ComprasContextType | undefined>(undefined);

export function ComprasProvider({ children }: { children: ReactNode }) {
  const [solpes, setSolpes] = useState<Solpe[]>([]);
  const [historialCompras, setHistorialCompras] = useState<Record<string, HistorialCompraProducto>>({});
  
  // Accedemos al inventario en tiempo real para asegurar consistencia estricta de IDs
  const { productos } = useInventario();

  // Cargar datos del localStorage al montar
  useEffect(() => {
    const solpesGuardadas = localStorage.getItem('corralon_solpes');
    const historialGuardado = localStorage.getItem('corralon_historial_compras');

    if (solpesGuardadas) {
      try {
        setSolpes(JSON.parse(solpesGuardadas));
      } catch (e) {
        console.error('Error al parsear solpes', e);
      }
    }

    if (historialGuardado) {
      try {
        setHistorialCompras(JSON.parse(historialGuardado));
      } catch (e) {
        console.error('Error al parsear historial de compras', e);
      }
    }
  }, []);

  // Guardar en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('corralon_solpes', JSON.stringify(solpes));
  }, [solpes]);

  useEffect(() => {
    localStorage.setItem('corralon_historial_compras', JSON.stringify(historialCompras));
  }, [historialCompras]);

  // Función para procesar y actualizar las estadísticas de compras por producto basada estrictamente en ID único
  const recalcularHistorial = (listaSolpes: Solpe[], listaProductosActuales: any[]) => {
    const nuevoHistorial: Record<string, HistorialCompraProducto> = {};

    // Filtrar solo las solpes recibidas o aprobadas que ya impactan compras reales
    const solpesValidas = listaSolpes.filter(s => s.estado === 'Recibida' || s.estado === 'Aprobada');

    // Agrupar compras por ID único de producto
    const comprasPorProd: Record<string, { idSolpe: string; fecha: string; cantidad: number; precioUnitario: number; }[]> = {};

    solpesValidas.forEach(solpe => {
      solpe.items.forEach(item => {
        // Validación estricta: normalizamos el ID para evitar desajustes
        const idUnicoItem = String(item.productoId);
        
        if (!comprasPorProd[idUnicoItem]) {
          comprasPorProd[idUnicoItem] = [];
        }
        comprasPorProd[idUnicoItem].push({
          idSolpe: solpe.idSolpe,
          fecha: solpe.fecha,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitarioCompra,
        });
      });
    });

    // Calcular métricas para cada producto usando su ID único
    Object.keys(comprasPorProd).forEach(productoId => {
      const compras = comprasPorProd[productoId].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

      let cantidadAcumulada = 0;
      let gastoTotalAcumulado = 0;
      const comprasDetalle = compras.map(c => {
        const gastoTotal = c.cantidad * c.precioUnitario;
        cantidadAcumulada += c.cantidad;
        gastoTotalAcumulado += gastoTotal;
        return {
          ...c,
          gastoTotal
        };
      });

      let frecuenciaPromedioDias = 0;
      if (compras.length > 1) {
        let sumaDiferenciasDias = 0;
        for (let i = 1; i < compras.length; i++) {
          const fechaAnterior = new Date(compras[i - 1].fecha).getTime();
          const fechaActual = new Date(compras[i].fecha).getTime();
          const diffDias = (fechaActual - fechaAnterior) / (1000 * 3600 * 24);
          sumaDiferenciasDias += diffDias;
        }
        frecuenciaPromedioDias = Math.round(sumaDiferenciasDias / (compras.length - 1));
      }

      nuevoHistorial[productoId] = {
        productoId,
        ultimaFechaCompra: compras[compras.length - 1].fecha,
        frecuenciaPromedioDias,
        cantidadAcumulada,
        gastoTotalAcumulado,
        compras: comprasDetalle
      };
    });

    setHistorialCompras(nuevoHistorial);
  };

  // Recalcular historial automáticamente si cambian los productos o las solpes
  useEffect(() => {
    if (solpes.length > 0) {
      recalcularHistorial(solpes, productos);
    }
  }, [productos]);

  const agregarSolpe = (nuevaSolpeData: Omit<Solpe, 'idSolpe'>) => {
    // Saneamiento de los ítems al crear la Solpe para garantizar que el ID sea la clave maestra
    itemsSanitizados: {
      const itemsValidados = nuevaSolpeData.items.map(item => {
        const prodEnStock = productos.find((p: any) => String(p.id ?? p.codigo) === String(item.productoId));
        return {
          ...item,
          productoId: prodEnStock ? String(prodEnStock.id ?? prodEnStock.codigo) : item.productoId,
          nombreProducto: prodEnStock ? prodEnStock.nombre : item.nombreProducto,
          codigoProducto: prodEnStock ? prodEnStock.codigo : item.codigoProducto,
        };
      });

      const nuevaSolpe: Solpe = {
        ...nuevaSolpeData,
        items: itemsValidados,
        idSolpe: `SOL-${Math.floor(1000 + Math.random() * 9000)}`,
      };

      const actualizadas = [nuevaSolpe, ...solpes];
      setSolpes(actualizadas);
      recalcularHistorial(actualizadas, productos);
    }
  };

  const actualizarEstadoSolpe = (idSolpe: string, nuevoEstado: Solpe['estado']) => {
    const actualizadas = solpes.map(s => 
      s.idSolpe === idSolpe ? { ...s, estado: nuevoEstado } : s
    );
    setSolpes(actualizadas);
    recalcularHistorial(actualizadas, productos);
  };

  const eliminarSolpe = (idSolpe: string) => {
    const actualizadas = solpes.filter(s => s.idSolpe !== idSolpe);
    setSolpes(actualizadas);
    recalcularHistorial(actualizadas, productos);
  };

  return (
    <ComprasContext.Provider value={{ solpes, historialCompras, agregarSolpe, actualizarEstadoSolpe, eliminarSolpe }}>
      {children}
    </ComprasContext.Provider>
  );
}

export function useCompras() {
  const context = useContext(ComprasContext);
  if (!context) {
    throw new Error('useCompras debe usarse dentro de un ComprasProvider');
  }
  return context;
}