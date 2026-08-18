'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria?: string;
  precio: number;
  precioEfectivo?: number;
  stockActual: number;
  stockMinimo: number;
  cantidadReservada: number;
  cantidadEnAcopio: number;
  proveedorPredeterminado?: string;
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
  importarOActualizarProductosMasivo: (nuevosProductos: { nombre: string; categoria?: string; precio: number; precioEfectivo?: number; stock: number; proveedor?: string }[]) => void;
  registrarPedido: (pedido: Omit<Pedido, 'id' | 'nroPedido' | 'fecha'>) => void;
  actualizarEstadoPedido: (id: string, estado: Pedido['estado']) => void;
  actualizarRetiroAcopio: (pedidoId: string, productoId: string, cantidadRetirada: number) => void;
  actualizarPedidoCompleto: (pedidoActualizado: Pedido) => void;
  registrarRecepcionCompra: (itemsCompra: { productoId: string; cantidad: number }[]) => void;
  restablecerInventario: () => void;
}

export const InventarioContext = createContext<InventarioContextType | undefined>(undefined);

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
    return [];
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
    return [];
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
    return [];
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
      id: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  const importarOActualizarProductosMasivo = (nuevosDatos: { nombre: string; categoria?: string; precio: number; precioEfectivo?: number; stock: number; proveedor?: string }[]) => {
    setProductos(prevProds => {
      let listaModificada = [...prevProds];

      nuevosDatos.forEach(item => {
        const nombreLimpio = item.nombre.trim().toLowerCase();
        const indiceExistente = listaModificada.findIndex(p => p.nombre.trim().toLowerCase() === nombreLimpio);

        if (indiceExistente >= 0) {
          const prodActual = listaModificada[indiceExistente];
          listaModificada[indiceExistente] = {
            ...prodActual,
            precio: item.precio || prodActual.precio,
            precioEfectivo: item.precioEfectivo ?? prodActual.precioEfectivo,
            stockActual: Number(prodActual.stockActual || 0) + Number(item.stock || 0),
            proveedorPredeterminado: item.proveedor || prodActual.proveedorPredeterminado
          };
        } else {
          const prefijo = 'PRD';
          const codigoAutomatico = `${prefijo}-${Math.floor(1000 + Math.random() * 9000)}`;
          listaModificada.unshift({
            id: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            codigo: codigoAutomatico,
            nombre: item.nombre,
            categoria: item.categoria || 'Áridos',
            precio: item.precio || 0,
            precioEfectivo: item.precioEfectivo || 0,
            stockActual: Number(item.stock) || 0,
            stockMinimo: 5,
            cantidadReservada: 0,
            cantidadEnAcopio: 0,
            proveedorPredeterminado: item.proveedor || ''
          });
        }
      });

      if (typeof window !== 'undefined') {
        localStorage.setItem('inventario_productos', JSON.stringify(listaModificada));
      }
      return listaModificada;
    });
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

  const registrarRecepcionCompra = (itemsCompra: { productoId: string; cantidad: number }[]) => {
    setProductos(prevProds => {
      const actualizados = prevProds.map(p => {
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

      if (typeof window !== 'undefined') {
        localStorage.setItem('inventario_productos', JSON.stringify(actualizados));
      }
      return actualizados;
    });
  };

  const restablecerInventario = () => {
    setProductos([]);
    setClientes([]);
    setPedidos([]);
    if (typeof window !== 'undefined') {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <InventarioContext.Provider value={{
      productos,
      pedidos,
      clientes,
      agregarProducto,
      actualizarStock,
      importarOActualizarProductosMasivo,
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