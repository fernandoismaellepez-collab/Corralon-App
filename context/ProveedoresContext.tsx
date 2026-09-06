'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Proveedor, ProductoProveedor, HistorialPrecio } from '../types/proveedores';
import { useInventario } from '@/context/InventarioContext';

interface ProveedoresContextType {
  proveedores: Proveedor[];
  agregarProveedor: (proveedor: Omit<Proveedor, 'idProveedor'>) => void;
  actualizarProveedor: (idProveedor: string, proveedorActualizado: Partial<Proveedor>) => void;
  eliminarProveedor: (idProveedor: string) => void;
  agregarOActualizarPrecioProducto: (idProveedor: string, productoId: string, codigo: string, nombre: string, nuevoPrecio: number) => void;
}

const ProveedoresContext = createContext<ProveedoresContextType | undefined>(undefined);

const proveedoresIniciales: Proveedor[] = [
  {
    idProveedor: '10001',
    nombre: 'Corralon Mayorista del Norte S.A.',
    telefono: '011-4455-6677',
    direccion: 'Ruta 8 Km 50, Pilar',
    cuit: '30-71234567-9',
    email: 'ventas@mayoristanorte.com',
    productosOfrecidos: [
      {
        productoId: '1',
        codigoProducto: 'CEM-001',
        nombreProducto: 'Cemento Avellaneda x 50kg',
        precioUnitarioActual: 9100,
        historialPrecios: [
          { fecha: '2026-06-01', precio: 8500 },
          { fecha: '2026-07-01', precio: 9100 }
        ]
      }
    ],
    observaciones: 'Proveedor principal de cementos y cales.'
  }
];

export const ProveedoresProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inventario = useInventario() as any;

  const [proveedores, setProveedores] = useState<Proveedor[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('corralon_proveedores') || localStorage.getItem('proveedores');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p: any) => {
              const idValido = p.idProveedor || p.id || Math.floor(10000 + Math.random() * 90000).toString();
              const esSoloNumeros = /^\d{5}$/.test(idValido);
              return {
                ...p,
                idProveedor: esSoloNumeros ? idValido : Math.floor(10000 + Math.random() * 90000).toString(),
                productosOfrecidos: p.productosOfrecidos || []
              };
            });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return proveedoresIniciales;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('corralon_proveedores', JSON.stringify(proveedores));
      localStorage.setItem('proveedores', JSON.stringify(proveedores));
    }
    // Sincronizamos también con el InventarioContext si soporta proveedores
    if (inventario && typeof inventario.sincronizarProveedores === 'function') {
      inventario.sincronizarProveedores(proveedores);
    }
  }, [proveedores]);

  const agregarProveedor = (nuevo: Omit<Proveedor, 'idProveedor'>) => {
    const idNumerico = Math.floor(10000 + Math.random() * 90000).toString();

    const proveedorCompleto: Proveedor = {
      ...nuevo,
      idProveedor: idNumerico,
      productosOfrecidos: nuevo.productosOfrecidos || []
    };
    setProveedores(prev => [proveedorCompleto, ...prev]);

    // Opcional: registrar en inventario si tiene la función de agregar proveedor
    if (inventario && typeof inventario.agregarProveedor === 'function') {
      inventario.agregarProveedor({
        nombre: nuevo.nombre,
        telefono: nuevo.telefono,
        email: nuevo.email,
        direccion: nuevo.direccion,
        cuit: nuevo.cuit
      });
    }
  };

  const actualizarProveedor = (idProveedor: string, datosActualizados: Partial<Proveedor>) => {
    setProveedores(prev => prev.map(p => p.idProveedor === idProveedor ? { ...p, ...datosActualizados } : p));
  };

  const eliminarProveedor = (idProveedor: string) => {
    setProveedores(prev => prev.filter(p => p.idProveedor !== idProveedor));
  };

  const agregarOActualizarPrecioProducto = (
    idProveedor: string,
    productoId: string,
    codigo: string,
    nombre: string,
    nuevoPrecio: number
  ) => {
    const fechaHoy = new Date().toISOString().split('T')[0];

    setProveedores(prev => prev.map(prov => {
      if (prov.idProveedor !== idProveedor) return prov;

      const productosExistentes = [...(prov.productosOfrecidos || [])];
      const index = productosExistentes.findIndex(p => p.productoId === productoId);

      if (index >= 0) {
        const prodActual = productosExistentes[index];
        if (prodActual.precioUnitarioActual !== nuevoPrecio) {
          productosExistentes[index] = {
            ...prodActual,
            precioUnitarioActual: nuevoPrecio,
            historialPrecios: [
              ...(prodActual.historialPrecios || []),
              { fecha: fechaHoy, precio: nuevoPrecio }
            ]
          };
        }
      } else {
        productosExistentes.push({
          productoId,
          codigoProducto: codigo,
          nombreProducto: nombre,
          precioUnitarioActual: nuevoPrecio,
          historialPrecios: [{ fecha: fechaHoy, precio: nuevoPrecio }]
        });
      }

      return { ...prov, productosOfrecidos: productosExistentes };
    }));
  };

  return (
    <ProveedoresContext.Provider value={{
      proveedores,
      agregarProveedor,
      actualizarProveedor,
      eliminarProveedor,
      agregarOActualizarPrecioProducto
    }}>
      {children}
    </ProveedoresContext.Provider>
  );
};

export const useProveedores = () => {
  const context = useContext(ProveedoresContext);
  if (!context) throw new Error('useProveedores debe usarse dentro de un ProveedoresProvider');
  return context;
};