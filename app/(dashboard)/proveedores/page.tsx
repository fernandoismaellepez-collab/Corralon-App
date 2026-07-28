'use client';

import React, { useState, useEffect } from 'react';
import { ProveedoresProvider, useProveedores } from '@/context/ProveedoresContext';
import { useInventario } from '@/context/InventarioContext';
import { Proveedor } from '@/types/proveedores';

function ProveedoresContent() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { proveedores, agregarProveedor, eliminarProveedor, agregarOActualizarPrecioProducto } = useProveedores();
  const { productos } = useInventario();

  const [busqueda, setBusqueda] = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(null);
  const [modalPrecioAbierto, setModalPrecioAbierto] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cuit, setCuit] = useState('');
  const [email, setEmail] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  if (!mounted) {
    return null;
  }

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.direccion.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleSubmitProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) return;

    agregarProveedor({
      nombre,
      telefono,
      direccion,
      cuit,
      email,
      productosOfrecidos: [],
      observaciones
    });

    setNombre('');
    setTelefono('');
    setDireccion('');
    setCuit('');
    setEmail('');
    setObservaciones('');
    setModalAbierto(false);
  };

  const handleAsociarPrecio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proveedorSeleccionado || !productoIdSeleccionado || !nuevoPrecio) return;

    const productoEnInventario = productos.find(p => p.id === productoIdSeleccionado);
    if (!productoEnInventario) return;

    agregarOActualizarPrecioProducto(
      proveedorSeleccionado.idProveedor,
      productoEnInventario.id,
      productoEnInventario.codigo,
      productoEnInventario.nombre,
      parseFloat(nuevoPrecio)
    );

    const provActualizado = proveedores.find(p => p.idProveedor === proveedorSeleccionado.idProveedor);
    if (provActualizado) {
      setProveedorSeleccionado(provActualizado);
    }

    setProductoIdSeleccionado('');
    setNuevoPrecio('');
    setModalPrecioAbierto(false);
  };

  return (
    <div className="p-8 w-full space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestión de Proveedores</h1>
          <p className="text-sm text-slate-400">Administra tus proveedores, costos de compra e histórico de precios.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-4 py-2 rounded-xl transition shadow cursor-pointer"
        >
          + Nuevo Proveedor
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre o dirección..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-96 px-4 py-2 border border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-900 text-white placeholder-slate-500 text-sm"
        />
      </div>

      <div className="bg-slate-900 shadow-md rounded-2xl overflow-x-auto border border-slate-800 w-full">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-950/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID / Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Contacto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Dirección / CUIT</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Productos y Último Aumento</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {proveedoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No se encontraron proveedores.
                </td>
              </tr>
            ) : (
              proveedoresFiltrados.map((prov) => (
                <tr key={prov.idProveedor} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 mr-2">
                      #{prov.idProveedor}
                    </span>
                    <div className="font-medium text-white inline-block">{prov.nombre}</div>
                    {prov.observaciones && <div className="text-xs text-slate-500 mt-0.5">{prov.observaciones}</div>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <div>📞 {prov.telefono || 'Sin teléfono'}</div>
                    <div className="text-xs text-slate-500">{prov.email || 'Sin email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                    <div>{prov.direccion || 'Sin dirección'}</div>
                    <div className="text-xs text-slate-500">CUIT: {prov.cuit || 'No especificado'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold w-fit">
                      {prov.productosOfrecidos.length} productos
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setProveedorSeleccionado(prov)}
                      className="text-amber-400 hover:text-amber-300 mr-3 transition cursor-pointer"
                    >
                      Ver Precios / Historial
                    </button>
                    <button
                      onClick={() => eliminarProveedor(prov.idProveedor)}
                      className="text-red-400 hover:text-red-300 transition cursor-pointer"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100">
            <h2 className="text-xl font-bold mb-4 text-white">Agregar Nuevo Proveedor</h2>
            <form onSubmit={handleSubmitProveedor} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-white focus:outline-none"
                  placeholder="Ej: Corralón del Valle S.A."
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 border border-slate-700 rounded-xl text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 text-slate-950 font-semibold rounded-xl hover:bg-amber-600 transition cursor-pointer"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProveedoresPage() {
  return (
    <ProveedoresProvider>
      <ProveedoresContent />
    </ProveedoresProvider>
  );
}