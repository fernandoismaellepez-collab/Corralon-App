import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlrxixsceubedsrnwfkg.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc';
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Falta el parámetro de búsqueda "q"' }, { status: 400 });
  }

  try {
    // Consultamos la fila 'productos' dentro de tu tabla app_data
    const { data, error } = await supabase
      .from('app_data')
      .select('payload')
      .eq('id', 'productos')
      .single();

    if (error) throw error;

    // El payload es una lista (array) de productos en formato JSON
    const listaProductos = data?.payload || [];
    const queryLower = query.toLowerCase().trim();

    // Filtramos localmente los productos que coincidan con el nombre
    const resultadosFiltrados = listaProductos.filter((item: any) => {
      const nombreProd = (item.nombre || item.descripcion || '').toLowerCase();
      return nombreProd.includes(queryLower);
    });

    if (resultadosFiltrados.length === 0) {
      return NextResponse.json({ 
        encontrados: 0,
        productos: [],
        mensaje: `❌ No encontré ningún producto con "${query}".` 
      });
    }

    let respuestaTexto = `🔍 Resultados para *"${query}"*:\n\n`;
    resultadosFiltrados.forEach((item: any) => {
      const precio = Number(item.precio || item.precio_venta || 0).toLocaleString('es-AR');
      const stock = item.stock || item.cantidad || 0;
      respuestaTexto += `📦 *{item.nombre}*\n💰 Precio: ${precio}\n📦 Stock: ${stock} disponibles\n\n`;
    });

    return NextResponse.json({ 
      encontrados: resultadosFiltrados.length,
      textoWhatsApp: respuestaTexto,
      productos: resultadosFiltrados 
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}