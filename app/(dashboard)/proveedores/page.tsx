'use client';

import React, { useState, useEffect } from 'react';
import { ProveedoresProvider, useProveedores } from '@/context/ProveedoresContext';
import { useInventario } from '@/context/InventarioContext';
import { Proveedor } from '@/types/proveedores';
import { Building2, Plus, Search, Trash2, X, History, Tag, ArrowUpRight } from 'lucide-react';

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

  // Estados del formulario de Nuevo Proveedor
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [cuit, setCuit] = useState('');
  const [email, setEmail] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Estados para asociar / editar precios
  const [productoIdSeleccionado, setProductoIdSeleccionado] = useState('');
  const [nuevoPrecio, setNuevoPrecio] = useState('');

  // Sincronización en tiempo real (TODOS LOS HOOKS SE DECLARAN ANTES DE CUALQUIER RETURN)
  useEffect(() => {
    if (proveedorSeleccionado) {
      const actualizado = proveedores.find(p => p.idProveedor === proveedorSeleccionado.idProveedor);
      if (actualizado) {
        setProveedorSeleccionado(actualizado);
      }
    }
  }, [proveedores, proveedorSeleccionado]);

  // AHORA SÍ SE HACE EL RETURN DE MONTAJE (DESPUÉS DE TODOS LOS HOOKS)
  if (!mounted) {
    return null;
  }

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.direccion && p.direccion.toLowerCase().includes(busqueda.toLowerCase()))
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

    setProductoIdSeleccionado('');
    setNuevoPrecio('');
    setModalPrecioAbierto(false);
  };

  return (
    <div className="p-8 w-full space-y-6 text-slate-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-500" />
            Gestión de Proveedores
          </h1>
          <p className="text-slate-400 mt-1">Administra tus proveedores, costos de compra e histórico de precios.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-5 py-2.5 rounded-xl transition shadow-lg shadow-amber-500/10 cursor-pointer flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Nuevo Proveedor
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-amber-500 text-sm"
          />
        </div>
      </div>

      <div className="bg-slate-900 shadow-xl rounded-xl overflow-x-auto border border-slate-800 w-full">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">ID / Nombre</th>
              <th className="px-6 py-4">Contacto</th>
              <th className="px-6 py-4">Dirección / CUIT</th>
              <th className="px-6 py-4 text-center">Productos y Costos</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {proveedoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  No se encontraron proveedores registrados.
                </td>
              </tr>
            ) : (
              proveedoresFiltrados.map((prov) => (
                <tr key={prov.idProveedor} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-slate-950 text-amber-500 px-2.5 py-1 rounded border border-slate-800 mr-2 font-bold">
                      #{prov.idProveedor}
                    </span>
                    <div className="font-medium text-white inline-block">{prov.nombre}</div>
                    {prov.observaciones && <div className="text-xs text-slate-500 mt-0.5">{prov.observaciones}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div>📞 {prov.telefono || 'Sin teléfono'}</div>
                    <div className="text-xs text-slate-500">{prov.email || 'Sin email'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-300">
                    <div>{prov.direccion || 'Sin dirección'}</div>
                    <div className="text-xs text-slate-500">CUIT: {prov.cuit || 'No especificado'}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs font-semibold">
                      {prov.productosOfrecidos ? prov.productosOfrecidos.length : 0} artículos
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button
                      onClick={() => setProveedorSeleccionado(prov)}
                      className="text-amber-400 hover:text-amber-300 font-semibold text-xs bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition cursor-pointer inline-flex items-center gap-1"
                    >
                      <Tag className="w-3.5 h-3.5" /> Ver Precios / Historial
                    </button>
                    <button
                      onClick={() => eliminarProveedor(prov.idProveedor)}
                      className="text-rose-400 hover:text-rose-300 p-1.5 transition cursor-pointer inline-block"
                      title="Eliminar Proveedor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: CREAR NUEVO PROVEEDOR */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" /> Agregar Nuevo Proveedor
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProveedor} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nombre o Razón Social *</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                  placeholder="Ej: Corralón del Valle S.A."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Ej: 011-4455-6677"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="ventas@proveedor.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Dirección</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={e => setDireccion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="Ej: Ruta 8 Km 50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">CUIT</label>
                  <input
                    type="text"
                    value={cuit}
                    onChange={e => setCuit(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                    placeholder="30-71234567-9"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Observaciones</label>
                <textarea
                  value={observaciones}
                  onChange={e => setObservaciones(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500 resize-none h-20"
                  placeholder="Detalles o notas del proveedor..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE, ARTÍCULOS E HISTORIAL DE PRECIOS DEL PROVEEDOR SELECCIONADO */}
      {proveedorSeleccionado && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl p-6 shadow-2xl relative my-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono bg-slate-950 text-amber-500 px-2.5 py-1 rounded border border-slate-800 font-bold mr-2">
                  #{proveedorSeleccionado.idProveedor}
                </span>
                <h2 className="text-xl font-bold text-white inline-block">{proveedorSeleccionado.nombre}</h2>
                <p className="text-xs text-slate-400 mt-1">Catálogo de artículos provistos e histórico de costos y aumentos.</p>
              </div>
              <button 
                onClick={() => setProveedorSeleccionado(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div>
                <p className="text-xs text-slate-400 font-medium">Información de Contacto</p>
                <p className="text-sm text-slate-200 mt-0.5">📞 {proveedorSeleccionado.telefono || 'Sin teléfono'} | ✉️ {proveedorSeleccionado.email || 'Sin email'}</p>
                <p className="text-xs text-slate-500 mt-0.5">📍 {proveedorSeleccionado.direccion || 'Sin dirección'} (CUIT: {proveedorSeleccionado.cuit || 'N/D'})</p>
              </div>
              <button
                onClick={() => setModalPrecioAbierto(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" /> Asociar / Actualizar Artículo
              </button>
            </div>

            {/* TABLA DE PRODUCTOS Y HISTORIAL DE PRECIOS */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-500" /> Artículos y Evolución de Precios
                </span>
                <span className="text-xs text-slate-500">{proveedorSeleccionado.productosOfrecidos ? proveedorSeleccionado.productosOfrecidos.length : 0} productos registrados</span>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="px-4 py-3">Código</th>
                      <th className="px-4 py-3">Nombre del Producto</th>
                      <th className="px-4 py-3 text-right">Precio Actual ($)</th>
                      <th className="px-4 py-3 text-right">Historial de Costos (Aumentos)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {proveedorSeleccionado.productosOfrecidos && proveedorSeleccionado.productosOfrecidos.length > 0 ? (
                      proveedorSeleccionado.productosOfrecidos.map((item: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="px-4 py-3 font-mono text-xs text-amber-400 font-semibold">{item.codigoProducto || 'S/C'}</td>
                          <td className="px-4 py-3 font-medium text-slate-100">{item.nombreProducto || 'Artículo sin nombre'}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-400">
                            ${(item.precioUnitarioActual ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-xs text-slate-400 space-y-1 inline-block text-left">
                              {item.historialPrecios && item.historialPrecios.length > 0 ? (
                                item.historialPrecios.map((h: any, hIdx: number) => (
                                  <div key={hIdx} className="font-mono text-[11px] flex items-center gap-1.5 justify-end bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                    <span className="text-slate-500">{h.fecha}:</span>
                                    <span className="text-slate-200 font-semibold">${(h.precio ?? 0).toLocaleString('es-AR')}</span>
                                    {hIdx > 0 && <ArrowUpRight className="w-3 h-3 text-amber-400 inline" />}
                                  </div>
                                ))
                              ) : (
                                <span className="text-slate-600 text-xs italic">Sin registros previos</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-xs">
                          Este proveedor aún no tiene artículos asociados ni precios cargados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setProveedorSeleccionado(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECUNDARIO: ASOCIAR O ACTUALIZAR PRECIO DE UN PRODUCTO */}
      {modalPrecioAbierto && proveedorSeleccionado && (
        <div className="fixed inset-0 z-60 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl relative text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-amber-500" /> Asignar / Actualizar Precio
              </h3>
              <button onClick={() => setModalPrecioAbierto(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAsociarPrecio} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Seleccionar Producto del Inventario *</label>
                <select
                  required
                  value={productoIdSeleccionado}
                  onChange={e => setProductoIdSeleccionado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                >
                  <option value="">-- Seleccionar producto --</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Nuevo Precio de Costo ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={nuevoPrecio}
                  onChange={e => setNuevoPrecio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 px-3 py-2 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalPrecioAbierto(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
                >
                  Guardar Precio
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