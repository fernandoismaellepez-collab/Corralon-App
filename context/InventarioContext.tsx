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
  sincronizando: boolean;
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
  const [usuarios, setUsuarios] = useState<UsuarioSistema[]>([]);
  const [gastosFijos, setGastosFijos] = useState<number>(500000);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [rolUsuario, setRolUsuario] = useState<'operador' | 'ejecutivo'>('operador');
  const [sincronizando, setSincronizando] = useState<boolean>(true);

  const supabase = createBrowserClient(
    'https://rlrxixsceubedsrnwfkg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc'
  );

  // Cargar datos de Supabase y asegurar respaldo inteligente
  useEffect(() => {
    async function inicializarDatos() {
      try {
        const { data, error } = await supabase.from('app_data').select('*');

        if (error) {
          console.error('Error al conectar con Supabase:', error);
          setSincronizando(false);
          return;
        }

        // Obtener lo que hay en localStorage de esta PC por si acaso
        const prodsLocal = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('inventario_productos') || '[]') : [];
        const pedsLocal = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('inventario_pedidos') || '[]') : [];
        const clisLocal = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('inventario_clientes') || '[]') : [];
        const usrsLocal = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('inventario_usuarios') || '[]') : [];
        const gastosLocal = typeof window !== 'undefined' ? Number(localStorage.getItem('inventario_gastos_fijos') || '500000') : 500000;

        if (data && data.length > 0) {
          const mapaDatos: Record<string, any> = {};
          data.forEach((row: any) => {
            mapaDatos[row.id] = row.payload;
          });

          // Si esta PC tiene datos locales y la nube está vacía o tiene menos, forzamos subida desde esta PC
          const prodsNube = mapaDatos['productos'] || [];
          if (prodsLocal.length > 0 && prodsNube.length === 0) {
            setProductos(prodsLocal);
            setPedidos(pedsLocal);
            setClientes(clisLocal);
            setUsuarios(usrsLocal);
            setGastosFijos(gastosLocal);

            await supabase.from('app_data').upsert([
              { id: 'productos', payload: prodsLocal },
              { id: 'pedidos', payload: pedsLocal },
              { id: 'clientes', payload: clisLocal },
              { id: 'usuarios', payload: usrsLocal },
              { id: 'gastosFijos', payload: gastosLocal }
            ]);
          } else {
            // Cargar normal desde la nube
            setProductos(prodsNube);
            setPedidos(mapaDatos['pedidos'] || []);
            setClientes(mapaDatos['clientes'] || []);
            setUsuarios(mapaDatos['usuarios'] || [
              { id: 'USR-1', nombre: 'Fernando', apellido: 'Lepez', email: 'fernandoismaellepez@gmail.com', rol: 'ejecutivo' }
            ]);
            setGastosFijos(mapaDatos['gastosFijos'] ?? 500000);
          }
        } else {
          // Si la tabla app_data está completamente vacía, subimos todo lo que tiene esta PC
          setProductos(prodsLocal);
          setPedidos(pedsLocal);
          setClientes(clisLocal);
          setUsuarios(usrsLocal);
          setGastosFijos(gastosLocal);

          await supabase.from('app_data').upsert([
            { id: 'productos', payload: prodsLocal },
            { id: 'pedidos', payload: pedsLocal },
            { id: 'clientes', payload: clisLocal },
            { id: 'usuarios', payload: usrsLocal },
            { id: 'gastosFijos', payload: gastosLocal }
          ]);
        }
      } catch (err) {
        console.error('Excepción al inicializar datos:', err);
      } finally {
        setSincronizando(false);
      }
    }

    inicializarDatos();
  }, []);

  // Guardar en Supabase y localStorage simultáneamente
  const guardarEnNubeYLocal = async (clave: string, datos: any) => {
    try {
      if (typeof window !== 'undefined') {
        if (typeof datos === 'number' || typeof datos === 'string') {
          localStorage.setItem(`inventario_${clave}`, String(datos));
        } else {
          localStorage.setItem(`inventario_${clave}`, JSON.stringify(datos));
        }
      }
      await supabase.from('app_data').upsert([
        { id: clave, payload: datos, updated_at: new Date().toISOString() }
      ]);
    } catch (err) {
      console.error(`Error al sincronizar ${clave}:`, err);
    }
  };

  useEffect(() => {
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

  const agregarUsuario = (nuevoUsuario: Omit<UsuarioSistema, 'id'>) => {
    const usuarioCompleto: UsuarioSistema = { ...nuevoUsuario, id: `USR-${Date.now()}` };
    const actualizados = [usuarioCompleto, ...usuarios];
    setUsuarios(actualizados);
    guardarEnNubeYLocal('usuarios', actualizados);
  };

  const eliminarUsuario = (id: string) => {
    const actualizados = usuarios.filter(u => u.id !== id);
    setUsuarios(actualizados);
    guardarEnNubeYLocal('usuarios', actualizados);
  };

  const cambiarGastosFijos = (gastos: number) => {
    setGastosFijos(gastos);
    guardarEnNubeYLocal('gastosFijos', gastos);
  };

  const agregarProducto = (nuevoProd: Omit<Producto, 'id' | 'cantidadReservada' | 'cantidadEnAcopio'>) => {
    const productoCompleto: Producto = {
      ...nuevoProd,
      id: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      cantidadReservada: 0,
      cantidadEnAcopio: 0,
    };
    const actualizados = [productoCompleto, ...productos];
    setProductos(actualizados);
    guardarEnNubeYLocal('productos', actualizados);
  };

  const actualizarStock = (id: string, cantidad: number, tipo: 'entrada' | 'salida' | 'ajuste', campo: 'stockActual' | 'cantidadEnAcopio' | 'cantidadReservada' = 'stockActual') => {
    const actualizados = productos.map(prod => {
      if (prod.id === id) {
        let valorActual = Number(prod[campo]) || 0;
        if (tipo === 'entrada') valorActual += cantidad;
        if (tipo === 'salida') valorActual = Math.max(0, valorActual - cantidad);
        if (tipo === 'ajuste') valorActual = cantidad;
        return { ...prod, [campo]: valorActual };
      }
      return prod;
    });
    setProductos(actualizados);
    guardarEnNubeYLocal('productos', actualizados);
  };

  const actualizarProductoCompleto = (productoActualizado: Producto) => {
    const actualizados = productos.map(p => p.id === productoActualizado.id ? { ...p, ...productoActualizado } : p);
    setProductos(actualizados);
    guardarEnNubeYLocal('productos', actualizados);
  };

  const importarOActualizarProductosMasivo = (nuevosDatos: { nombre: string; categoria?: string; precio: number; precioEfectivo?: number; stock: number; proveedor?: string }[]) => {
    let listaModificada = [...productos];
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
        listaModificada.unshift({
          id: `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          codigo: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
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

    setProductos(listaModificada);
    guardarEnNubeYLocal('productos', listaModificada);
  };

  const registrarPedido = (nuevoPedidoData: Omit<Pedido, 'id' | 'nroPedido' | 'fecha'>) => {
    let clienteId = nuevoPedidoData.clienteId;
    const clienteExistente = clientes.find(c => c.id === clienteId || c.nombre.toLowerCase() === nuevoPedidoData.nombreCliente.toLowerCase());

    let nuevosClientes = [...clientes];
    if (!clienteExistente) {
      clienteId = `CLI-${Date.now().toString().slice(-4)}`;
      nuevosClientes.push({
        id: clienteId,
        nombre: nuevoPedidoData.nombreCliente,
        telefono: nuevoPedidoData.telefonoCliente,
        direccion: nuevoPedidoData.direccionEntrega,
      });
      setClientes(nuevosClientes);
      guardarEnNubeYLocal('clientes', nuevosClientes);
    }

    const nroPedido = `#${Math.floor(100 + Math.random() * 900)}`;
    const nuevoPedido: Pedido = {
      ...nuevoPedidoData,
      clienteId,
      id: `PED-${Date.now()}`,
      nroPedido,
      fecha: new Date().toISOString().split('T')[0],
    };

    const nuevosProductos = productos.map(p => {
      const itemEncontrado = nuevoPedido.items.find(i => i.productoId === p.id);
      if (itemEncontrado) {
        return { ...p, stockActual: Math.max(0, Number(p.stockActual) - Number(itemEncontrado.cantidad)) };
      }
      return p;
    });

    const nuevosPedidos = [nuevoPedido, ...pedidos];

    setProductos(nuevosProductos);
    setPedidos(nuevosPedidos);

    guardarEnNubeYLocal('productos', nuevosProductos);
    guardarEnNubeYLocal('pedidos', nuevosPedidos);
  };

  const actualizarEstadoPedido = (id: string, estado: Pedido['estado']) => {
    let productosModificados = [...productos];
    const nuevosPedidos = pedidos.map(ped => {
      if (ped.id === id) {
        if (estado === 'Cancelado' && ped.estado !== 'Cancelado') {
          ped.items.forEach(item => {
            productosModificados = productosModificados.map(p => 
              p.id === item.productoId ? { ...p, stockActual: Number(p.stockActual) + Number(item.cantidad) } : p
            );
          });
        }
        return { ...ped, estado };
      }
      return ped;
    });

    setPedidos(nuevosPedidos);
    setProductos(productosModificados);

    guardarEnNubeYLocal('pedidos', nuevosPedidos);
    guardarEnNubeYLocal('productos', productosModificados);
  };

  const actualizarRetiroAcopio = (pedidoId: string, productoId: string, cantidadRetirada: number) => {
    const nuevosPedidos = pedidos.map(ped => {
      if (ped.id === pedidoId) {
        const nuevosItems = ped.items.map(item => {
          if (item.productoId === productoId && item.acopio) {
            const pendienteActual = item.acopio.cantidadPendienteRetiro;
            return {
              ...item,
              acopio: { ...item.acopio, cantidadPendienteRetiro: Math.max(0, pendienteActual - cantidadRetirada) }
            };
          }
          return item;
        });
        return { ...ped, items: nuevosItems };
      }
      return ped;
    });

    setPedidos(nuevosPedidos);
    guardarEnNubeYLocal('pedidos', nuevosPedidos);
  };

  const actualizarPedidoCompleto = (pedidoActualizado: Pedido) => {
    const nuevosPedidos = pedidos.map(ped => ped.id === pedidoActualizado.id ? pedidoActualizado : ped);
    setPedidos(nuevosPedidos);
    guardarEnNubeYLocal('pedidos', nuevosPedidos);
  };

  const registrarRecepcionCompra = (itemsCompra: { productoId: string; cantidad: number }[]) => {
    const actualizados = productos.map(p => {
      const itemEncontrado = itemsCompra.find(ic => String(ic.productoId).trim() === String(p.id).trim());
      if (itemEncontrado) {
        return { ...p, stockActual: (Number(p.stockActual) || 0) + (Number(itemEncontrado.cantidad) || 0) };
      }
      return p;
    });

    setProductos(actualizados);
    guardarEnNubeYLocal('productos', actualizados);
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
      sincronizando,
      setRolUsuario,
      setGastosFijos: cambiarGastosFijos,
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