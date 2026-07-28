'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { 
  Package, 
  ShoppingCart, 
  ShoppingBag, 
  LayoutDashboard,
  Truck,
  ClipboardList,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Cliente de Supabase blindado por fuerza bruta
  const supabase = createBrowserClient(
    'https://rlrxixsceubedsrnwfkg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJscnhpeHNjZXViZWRzcm53ZmtnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxOTE5NzIsImV4cCI6MjEwMDc2Nzk3Mn0.vozdkpcvWK3M3rmfCZLDiGNwrJP1t9BASEcecmJZJIc'
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    {
      label: 'Panel de Control',
      href: '/',
      icon: LayoutDashboard,
    },
    {
      label: 'Stock',
      href: '/productos',
      icon: Package,
    },
    {
      label: 'Ventas',
      href: '/ventas',
      icon: ShoppingCart,
    },
    {
      label: 'Pedidos',
      href: '/pedidos',
      icon: ShoppingBag,
    },
    {
      label: 'Proveedores',
      href: '/proveedores',
      icon: Truck,
    },
    {
      label: 'Compras y Solpes',
      href: '/compras',
      icon: ClipboardList,
    },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Isologotipo / App Name interactivo hacia el Dashboard */}
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors hover:bg-slate-900 group"
        >
          <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 group-hover:border-amber-500/40 transition-colors">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 leading-tight group-hover:text-amber-400 transition-colors">Inventario</h2>
            <p className="text-xs text-slate-500 font-medium">Panel de Control</p>
          </div>
        </Link>

        {/* Links del Menú */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.href === '/' 
              ? pathname === '/' 
              : pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Pie del Sidebar con Botón de Cerrar Sesión y Versión */}
      <div className="border-t border-slate-800/80 pt-4 px-2 space-y-3">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition text-sm font-medium w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Cerrar Sesión</span>
        </button>

        <p className="text-xs text-slate-600 font-mono px-2">v1.0.0 — Sistema Stock</p>
      </div>
    </aside>
  );
}