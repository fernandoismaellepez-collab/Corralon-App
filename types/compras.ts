export interface ItemSolpe {
  productoId: string;
  codigoProducto: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitarioCompra: number; // Precio al que te vende el proveedor
  precioUnitarioVentaActual: number; // Precio al que lo vendés en tu local
  subtotalCompra: number;
  margenGananciaPorcentaje: number; // Calculado automáticamente
}

export interface Solpe {
  idSolpe: string;
  fecha: string;
  idProveedor: string;
  nombreProveedor: string;
  estado: 'Pendiente' | 'Aprobada' | 'Recibida' | 'Cancelada';
  items: ItemSolpe[];
  totalCompra: number;
  observaciones?: string;
}

export interface HistorialCompraProducto {
  productoId: string;
  ultimaFechaCompra: string;
  frecuenciaPromedioDias: number; // Cada cuánto tiempo se compra
  cantidadAcumulada: number;
  gastoTotalAcumulado: number;
  compras: {
    idSolpe: string;
    fecha: string;
    cantidad: number;
    precioUnitario: number;
    gastoTotal: number;
  }[];
}