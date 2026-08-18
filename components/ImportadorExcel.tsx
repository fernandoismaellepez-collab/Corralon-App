'use client';

import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ImportadorExcel({ onImportar }: { onImportar: (datos: any[]) => void }) {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    const lector = new FileReader();
    lector.onload = (evt) => {
      const bstr = evt.target?.result;
      const workbook = XLSX.read(bstr, { type: 'binary' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const datos = XLSX.utils.sheet_to_json(hoja);
      onImportar(datos);
    };
    lector.readAsBinaryString(archivo);
    e.target.value = '';
  };

  return (
    <label className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg cursor-pointer text-sm shadow-lg">
      <Download className="w-4 h-4" /> Importar Excel
      <input type="file" accept=".xlsx, .xls" onChange={handleFile} className="hidden" />
    </label>
  );
}