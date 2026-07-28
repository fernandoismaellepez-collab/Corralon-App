'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria?: string;
  precio: number;
  stockActual: number;
  stockMinimo: number;
  cantidadReservada: number;
  cantidadEnAcopio: number;
}

export interface DetalleAcopio {
  esAcopio: boolean;
  diasResguardo: number;
  fechaEntregaPactada?: string;
  cantidadAcopiadaInicial: number;
  cantidadPendienteRetiro: number;
}

export interface ItemPedido {
  productoId: string;
  codigo: string;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  estadoItem?: 'Pendiente' | 'Entregado' | 'Anulado';
  acopio?: DetalleAcopio;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string;
  direccion: string;
}

export interface Pedido {
  id: string;
  nroPedido: string;
  clienteId: string;
  nombreCliente: string;
  telefonoCliente: string;
  direccionEntrega: string;
  requiereGrua: 'SI' | 'NO';
  items: ItemPedido[];
  total: number;
  estado: 'Pendiente' | 'Preparado' | 'Entregado' | 'Cancelado';
  fecha: string;
  observacionCancelacion?: string;
}

export interface InventarioContextType {
  productos: Producto[];
  pedidos: Pedido[];
  clientes: Cliente[];
  agregarProducto: (producto: Omit<Producto, 'id' | 'cantidadReservada' | 'cantidadEnAcopio'>) => void;
  actualizarStock: (id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', campo?: 'stockActual' | 'cantidadEnAcopio' | 'cantidadReservada') => void;
  registrarPedido: (pedido: Omit<Pedido, 'id' | 'nroPedido' | 'fecha'>) => void;
  actualizarEstadoPedido: (id: string, estado: Pedido['estado']) => void;
  actualizarRetiroAcopio: (pedidoId: string, productoId: string, cantidadRetirada: number) => void;
  actualizarPedidoCompleto: (pedidoActualizado: Pedido) => void;
  restablecerInventario: () => void;
}

export const InventarioContext = createContext<InventarioContextType | undefined>(undefined);

const productosIniciales: Producto[] = [
  { id: '1', codigo: 'ARI-001', nombre: 'Arena Falsa / Común (m3)', categoria: 'Áridos', precio: 18500, stockActual: 45, stockMinimo: 10, cantidadReservada: 0, cantidadEnAcopio: 5 },
  { id: '2', codigo: 'CEM-001', nombre: 'Cemento Avellaneda 50kg', categoria: 'Cementos y Cal', precio: 9800, stockActual: 120, stockMinimo: 25, cantidadReservada: 0, cantidadEnAcopio: 15 },
  { id: '3', codigo: 'LAD-001', nombre: 'Ladrillo Hueco 12x18x33', categoria: 'Ladrillos y Bloques', precio: 450, stockActual: 1500, stockMinimo: 300, cantidadReservada: 0, cantidadEnAcopio: 0 },
  { id: '4', codigo: 'HIER-01', nombre: 'Hierro del 8 mm (Acindar)', categoria: 'Hierros y Mallas', precio: 6200, stockActual: 80, stockMinimo: 20, cantidadReservada: 0, cantidadEnAcopio: 10 },
];

const clientesIniciales: Cliente[] = [
  { id: 'CLI-001', nombre: 'Juan Pérez', telefono: '11 2345-6789', direccion: 'Av. San Martín 1234, Pilar' },
  { id: 'CLI-002', nombre: 'María Gómez', telefono: '11 9876-5432', direccion: 'Calle Belgrano 456, Derqui' },
];

const pedidosIniciales: Pedido[] = [
  {
    id: 'PED-101',
    nroPedido: '#101',
    clienteId: 'CLI-001',
    nombreCliente: 'Juan Pérez',
    telefonoCliente: '11 2345-6789',
    direccionEntrega: 'Av. San Martín 1234, Pilar',
    requiereGrua: 'SI',
    items: [
      {
        productoId: '2',
        codigo: 'CEM-001',
        nombre: 'Cemento Avellaneda 50kg',
        precioUnitario: 9800,
        cantidad: 15,
        estadoItem: 'Pendiente',
        acopio: {
          esAcopio: true,
          diasResguardo: 30,
          fechaEntregaPactada: '2026-04-15',
          cantidadAcopiadaInicial: 15,
          cantidadPendienteRetiro: 15
        }
      }
    ],
    total: 147000,
    estado: 'Pendiente',
    fecha: '2026-03-28'
  }
];

export function useInventario() {
  const context = useContext(InventarioContext);
  if (!context) {
    throw new Error('useInventario debe usarse dentro de un InventarioProvider');
  }
  return context;
}

export function InventarioProvider({ children }: { children: React.ReactNode }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(pedidosIniciales);
  const [productos, setProductos] = useState<Producto[]>(productosIniciales);
  const [clientes, setClientes] = useState<Cliente[]>(clientesIniciales);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carga inicial desde localStorage solo en el cliente tras el primer render
  useEffect(() => {
    try {
      const guardadosPedidos = localStorage.getItem('inventario_pedidos');
      if (guardadosPedidos) setPedidos(JSON.parse(guardadosPedidos));

      const guardadosProductos = localStorage.getItem('inventario_productos');
      if (guardadosProductos) setProductos(JSON.parse(guardadosProductos));

      const guardadosClientes = localStorage.getItem('inventario_clientes');
      if (guardadosClientes) setClientes(JSON.parse(guardadosClientes));
    } catch (e) {
      console.error('Error al cargar de localStorage:', e);
    }
    setIsLoaded(true);
  }, []);

  // Guardado automático en localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('inventario_pedidos', JSON.stringify(pedidos));
    } catch (e) {
      console.error('Error al guardar pedidos:', e);
    }
  }, [pedidos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('inventario_productos', JSON.stringify(productos));
    } catch (e) {
      console.error('Error al guardar productos:', e);
    }
  }, [productos, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('inventario_clientes', JSON.stringify(clientes));
    } catch (e) {
      console.error('Error al guardar clientes:', e);
    }
  }, [clientes, isLoaded]);

  useEffect(() => {
    setProductos(prevProds => {
      return prevProds.map(prod => {
        let totalAcopioProd = 0;
        pedidos.forEach(ped => {
          if (ped.estado !== 'Entregado' && ped.estado !== 'Cancelado') {
            ped.items.forEach(item => {
              if (item.productoId === prod.id && item.acopio?.esAcopio) {
                totalAcopioProd += item.acopio.cantidadPendienteRetiro;
              }
            });
          }
        });
        return {
          ...prod,
          cantidadEnAcopio: totalAcopioProd
        };
      });
    });
  }, [pedidos]);

  const agregarProducto = (nuevoProd: Omit<Producto, 'id' | 'cantidadReservada' | 'cantidadEnAcopio'>) => {
    const productoCompleto: Producto = {
      ...nuevoProd,
      id: Date.now().toString(),
      cantidadReservada: 0,
      cantidadEnAcopio: 0,
    };
    setProductos(prev => [productoCompleto, ...prev]);
  };

  const actualizarStock = (id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', campo: 'stockActual' | 'cantidadEnAcopio' | 'cantidadReservada' = 'stockActual') => {
    setProductos(prev => prev.map(prod => {
      if (prod.id === id) {
        let valorActual = prod[campo];
        if (tipo === 'entrada') valorActual += cantidad;
        if (tipo === 'salida') valorActual = Math.max(0, valorActual - cantidad);
        if (tipo === 'ajuste') valorActual = cantidad;
        return { ...prod, [campo]: valorActual };
      }
      return prod;
    }));
  };

  const registrarPedido = (nuevoPedidoData: Omit<Pedido, 'id' | 'nroPedido' | 'fecha'>) => {
    let clienteId = nuevoPedidoData.clienteId;
    const clienteExistente = clientes.find(c => c.id === clienteId || c.nombre.toLowerCase() === nuevoPedidoData.nombreCliente.toLowerCase());

    if (!clienteExistente) {
      clienteId = `CLI-${Date.now().toString().slice(-4)}`;
      const nuevoCliente: Cliente = {
        id: clienteId,
        nombre: nuevoPedidoData.nombreCliente,
        telefono: nuevoPedidoData.telefonoCliente,
        direccion: nuevoPedidoData.direccionEntrega,
      };
      setClientes(prev => [...prev, nuevoCliente]);
    } else {
      clienteId = clienteExistente.id;
    }

    const itemsNormalizados = nuevoPedidoData.items.map(item => {
      if (item.acopio?.esAcopio) {
        return {
          ...item,
          acopio: {
            ...item.acopio,
            cantidadAcopiadaInicial: item.cantidad,
            cantidadPendienteRetiro: item.cantidad,
          }
        };
      }
      return item;
    });

    const nroPedido = `#${Math.floor(100 + Math.random() * 900)}`;
    const nuevoPedido: Pedido = {
      ...nuevoPedidoData,
      items: itemsNormalizados,
      clienteId,
      id: `PED-${Date.now()}`,
      nroPedido,
      fecha: new Date().toISOString().split('T')[0],
    };

    nuevoPedido.items.forEach(item => {
      setProductos(prevProds => prevProds.map(p => {
        if (p.id === item.productoId) {
          return {
            ...p,
            stockActual: Math.max(0, p.stockActual - item.cantidad)
          };
        }
        return p;
      }));
    });

    setPedidos(prev => [nuevoPedido, ...prev]);
  };

  const actualizarEstadoPedido = (id: string, estado: Pedido['estado']) => {
    setPedidos(prev => prev.map(ped => {
      if (ped.id === id) {
        if (estado === 'Cancelado' && ped.estado !== 'Cancelado') {
          ped.items.forEach(item => {
            setProductos(prods => prods.map(p => p.id === item.productoId ? { ...p, stockActual: p.stockActual + item.cantidad } : p));
          });
        }
        return { ...ped, estado };
      }
      return ped;
    }));
  };

  const actualizarRetiroAcopio = (pedidoId: string, productoId: string, cantidadRetirada: number) => {
    setPedidos(prev => prev.map(ped => {
      if (ped.id === pedidoId) {
        const nuevosItems = ped.items.map(item => {
          if (item.productoId === productoId && item.acopio) {
            const pendienteActual = item.acopio.cantidadPendienteRetiro;
            const nuevaCantidadPendiente = Math.max(0, pendienteActual - cantidadRetirada);
            return {
              ...item,
              acopio: {
                ...item.acopio,
                cantidadPendienteRetiro: nuevaCantidadPendiente
              }
            };
          }
          return item;
        });
        return { ...ped, items: nuevosItems };
      }
      return ped;
    }));
  };

  const actualizarPedidoCompleto = (pedidoActualizado: Pedido) => {
    setPedidos(prevPedidos => prevPedidos.map(ped => {
      if (ped.id === pedidoActualizado.id) {
        return pedidoActualizado;
      }
      return ped;
    }));
  };

  const restablecerInventario = () => {
    setProductos(productosIniciales);
    setClientes(clientesIniciales);
    setPedidos(pedidosIniciales);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inventario_pedidos');
      localStorage.removeItem('inventario_productos');
      localStorage.removeItem('inventario_clientes');
    }
  };

  return (
    <InventarioContext.Provider value={{
      productos,
      pedidos,
      clientes,
      agregarProducto,
      actualizarStock,
      registrarPedido,
      actualizarEstadoPedido,
      actualizarRetiroAcopio,
      actualizarPedidoCompleto,
      restablecerInventario
    }}>
      {children}
    </InventarioContext.Provider>
  );
}