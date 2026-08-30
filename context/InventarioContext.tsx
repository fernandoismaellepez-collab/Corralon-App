'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

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

export interface UsuarioSistema {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'operador' | 'ejecutivo';
}

export interface InventarioContextType {
  productos: Producto[];
  pedidos: Pedido[];
  clientes: Cliente[];
  usuarios: UsuarioSistema[];
  gastosFijos: number;
  rolUsuario: 'operador' | 'ejecutivo';
  setRolUsuario: (rol: 'operador' | 'ejecutivo') => void;
  setGastosFijos: (gastos: number) => void;
  agregarProducto: (producto: Omit<Producto, 'id' | 'cantidadReservada' | 'cantidadEnAcopio'>) => void;
  actualizarStock: (id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', campo?: 'stockActual' | 'cantidadEnAcopio' | 'cantidadReservada') => void;
  actualizarProductoCompleto: (productoActualizado: Producto) => void;
  importarOActualizarProductosMasivo: (nuevosProductos: { nombre: string; categoria?: string; precio: number; precioEfectivo?: number; stock: number; proveedor?: string }[]) => void;
  registrarPedido: (pedido: Omit<Pedido, 'id' | 'nroPedido' | 'fecha'>) => void;
  actualizarEstadoPedido: (id: string, estado: Pedido['estado']) => void;
  actualizarRetiroAcopio: (pedidoId: string, productoId: string, cantidadRetirada: number) => void;
  actualizarPedidoCompleto: (pedidoActualizado: Pedido) => void;
  registrarRecepcionCompra: (itemsCompra: { productoId: string; cantidad: number }[]) => void;
  agregarUsuario: (usuario: Omit<UsuarioSistema, 'id'>) => void;
  eliminarUsuario: (id: string) => void;
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
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardados = localStorage.getItem('inventario_usuarios');
        if (guardados) return JSON.parse(guardados);
      } catch (e) {
        console.error('Error al leer usuarios:', e);
      }
    }
    return [
      { id: 'USR-1', nombre: 'Fernando', apellido: 'Lepez', email: 'fernandoismaellepez@gmail.com', rol: 'ejecutivo' }
    ];
  });

  const [rolUsuario, setRolUsuario] = useState<'operador' | 'ejecutivo'>('operador');

  useEffect(() => {
    const supabase = createBrowserClient(
      'https://rlrxixsceubedsrnwfkg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc'
    );

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const usuarioEncontrado = usuarios.find(u => u.email.toLowerCase() === user.email?.toLowerCase());
        if (usuarioEncontrado) {
          setRolUsuario(usuarioEncontrado.rol);
        } else if (user.email === 'fernandoismaellepez@gmail.com') {
          setRolUsuario('ejecutivo');
        } else {
          setRolUsuario('operador');
        }
      }
    });
  }, [usuarios]);

  const [gastosFijos, setGastosFijos] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const guardado = localStorage.getItem('inventario_gastos_fijos');
        if (guardado) return Number(guardado);
      } catch (e) {
        console.error('Error al leer gastos fijos:', e);
      }
    }
    return 500000;
  });

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
      localStorage.setItem('inventario_gastos_fijos', String(gastosFijos));
    } catch (e) {
      console.error('Error al guardar gastos fijos:', e);
    }
  }, [gastosFijos]);

  useEffect(() => {
    try {
      localStorage.setItem('inventario_usuarios', JSON.stringify(usuarios));
    } catch (e) {
      console.error('Error al guardar usuarios:', e);
    }
  }, [usuarios]);

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

  const agregarUsuario = (nuevoUsuario: Omit<UsuarioSistema, 'id'>) => {
    const usuarioCompleto: UsuarioSistema = {
      ...nuevoUsuario,
      id: `USR-${Date.now()}`
    };
    setUsuarios(prev => [usuarioCompleto, ...prev]);
  };

  const eliminarUsuario = (id: string) => {
    setUsuarios(prev => prev.filter(u => u.id !== id));
  };

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

  const actualizarProductoCompleto = (productoActualizado: Producto) => {
    setProductos(prevProds => {
      const actualizados = prevProds.map(p => {
        if (p.id === productoActualizado.id) {
          return {
            ...p,
            ...productoActualizado
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
    setUsuarios([]);
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
      usuarios,
      gastosFijos,
      rolUsuario,
      setRolUsuario,
      setGastosFijos,
      agregarProducto,
      actualizarStock,
      actualizarProductoCompleto,
      importarOActualizarProductosMasivo,
      registrarPedido,
      actualizarEstadoPedido,
      actualizarRetiroAcopio,
      actualizarPedidoCompleto,
      registrarRecepcionCompra,
      agregarUsuario,
      eliminarUsuario,
      restablecerInventario
    }}>
      {children}
    </InventarioContext.Provider>
  );
}