'use client';

import { FileSpreadsheet } from 'lucide-react';

interface BotonExportarStockProps {
  productos: any[];
}

export default function BotonExportarStock({ productos }: BotonExportarStockProps) {
  const exportarStockExcel = () => {
    const datosAExportar = productos;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Codigo;Categoria;Nombre;Stock Actual;Precio\n";

    datosAExportar.forEach((p: any) => {
      const fila = `"${p.codigo || ''}";"${p.categoria || 'General'}";"${p.nombre}";"${p.stockActual}";"$${p.precio}"`;
      csvContent += fila + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `stock_corralon_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportarStockExcel}
      className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
    >
      <FileSpreadsheet className="w-4 h-4" /> Exportar a Excel
    </button>
  );
}