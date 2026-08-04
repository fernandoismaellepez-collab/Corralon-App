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
  registrarRecepcionCompra: (itemsCompra: { productoId: string; cantidad: number }[]) => void;
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

const pedidosIniciales: Pedido[] = [];

export function useInventario() {
  const context = useContext(InventarioContext);
  if (!context) {
    throw new Error('useInventario debe usarse dentro de un InventarioProvider');
  }
  return context;
}

export function InventarioProvider({ children }: { children: React.ReactNode }) {
  const [productos, setProductos] = useState<Producto[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardados = localStorage.getItem('inventario_productos');
        if (guardados) return JSON.parse(guardados);
      } catch (e) {
        console.error('Error al leer productos:', e);
      }
    }
    return productosIniciales;
  });

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardados = localStorage.getItem('inventario_pedidos');
        if (guardados) return JSON.parse(guardados);
      } catch (e) {
        console.error('Error al leer pedidos:', e);
      }
    }
    return pedidosIniciales;
  });

  const [clientes, setClientes] = useState<Cliente[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardados = localStorage.getItem('inventario_clientes');
        if (guardados) return JSON.parse(guardados);
      } catch (e) {
        console.error('Error al leer clientes:', e);
      }
    }
    return clientesIniciales;
  });

  useEffect(() => {
    try {
      localStorage.setItem('inventario_productos', JSON.stringify(productos));
    } catch (e) {
      console.error('Error al guardar productos:', e);
    }
  }, [productos]);

  useEffect(() => {
    try {
      localStorage.setItem('inventario_pedidos', JSON.stringify(pedidos));
    } catch (e) {
      console.error('Error al guardar pedidos:', e);
    }
  }, [pedidos]);

  useEffect(() => {
    try {
      localStorage.setItem('inventario_clientes', JSON.stringify(clientes));
    } catch (e) {
      console.error('Error al guardar clientes:', e);
    }
  }, [clientes]);

  const agregarProducto = (nuevoProd: Omit<Producto, 'id' | 'cantidadReservada' | 'cantidadEnAcopio'>) => {
    const productoCompleto: Producto = {
      ...nuevoProd,
      id: `PROD-${Date.now()}`,
      cantidadReservada: 0,
      cantidadEnAcopio: 0,
    };
    setProductos(prev => [productoCompleto, ...prev]);
  };

  const actualizarStock = (id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', campo: 'stockActual' | 'cantidadEnAcopio' | 'cantidadReservada' = 'stockActual') => {
    setProductos(prev => prev.map(prod => {
      if (prod.id === id) {
        let valorActual = Number(prod[campo]) || 0;
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

    const nroPedido = `#${Math.floor(100 + Math.random() * 900)}`;
    const nuevoPedido: Pedido = {
      ...nuevoPedidoData,
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
            stockActual: Math.max(0, Number(p.stockActual) - Number(item.cantidad))
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
            setProductos(prods => prods.map(p => p.id === item.productoId ? { ...p, stockActual: Number(p.stockActual) + Number(item.cantidad) } : p));
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

  // VINCULACIÓN MAESTRA Y SÍNCRONA POR ID ÚNICO
  const registrarRecepcionCompra = (itemsCompra: { productoId: string; cantidad: number }[]) => {
    if (typeof window === 'undefined') return;

    try {
      const guardados = localStorage.getItem('inventario_productos');
      let listaActual: Producto[] = guardados ? JSON.parse(guardados) : productos;

      const actualizados = listaActual.map(p => {
        const itemEncontrado = itemsCompra.find(ic => String(ic.productoId).trim() === String(p.id).trim());

        if (itemEncontrado) {
          const stockActualNum = Number(p.stockActual) || 0;
          const cantidadRecibidaNum = Number(itemEncontrado.cantidad) || 0;
          return {
            ...p,
            stockActual: stockActualNum + cantidadRecibidaNum
          };
        }
        return p;
      });

      localStorage.setItem('inventario_productos', JSON.stringify(actualizados));
      setProductos(actualizados);
    } catch (e) {
      console.error('Error al registrar la recepción de compra:', e);
    }
  };

  const restablecerInventario = () => {
    setProductos(productosIniciales);
    setClientes(clientesIniciales);
    setPedidos(pedidosIniciales);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('inventario_pedidos');
      localStorage.removeItem('inventario_productos');
      localStorage.removeItem('inventario_clientes');
      localStorage.removeItem('corralon_ordenes_compra');
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
      registrarRecepcionCompra,
      restablecerInventario
    }}>
      {children}
    </InventarioContext.Provider>
  );
}