import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InventarioProvider } from "@/context/InventarioContext";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistema de Inventario y Corralón",
  description: "Gestión de stock, pedidos y acopios",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100`}>
        <InventarioProvider>
          <div className="flex min-h-screen">
            {/* Barra lateral fija a la izquierda */}
            <Sidebar />

            {/* Contenido principal de la ruta activa */}
            <main className="flex-1 p-8 overflow-y-auto bg-slate-950">
              {children}
            </main>
          </div>
        </InventarioProvider>
      </body>
    </html>
  );
}