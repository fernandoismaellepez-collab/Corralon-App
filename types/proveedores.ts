export interface HistorialPrecio {
  fecha: string;       // Ej: '2026-07-23'
  precio: number;      // Precio en esa fecha específica
}

export interface ProductoProveedor {
  productoId: string;           // Relacionado con tu catálogo de productos actual
  codigoProducto: string;       // Código del producto (ej: CEM-001)
  nombreProducto: string;       // Nombre para referencia rápida
  precioUnitarioActual: number; // Precio de compra actual
  historialPrecios: HistorialPrecio[]; // Para graficar o listar aumentos
}

export interface Proveedor {
  idProveedor: string;
  nombre: string;               // Persona física o Razón Social (Empresa)
  telefono: string;
  direccion: string;
  cuit?: string;                // Útil para facturación en Argentina
  email?: string;
  productosOfrecidos: ProductoProveedor[]; // Qué productos vende y a qué precio
  observaciones?: string;
}