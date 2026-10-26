'use client';

import React from 'react';
import { ProveedoresProvider } from '@/context/ProveedoresContext';
import { InventarioProvider } from '@/context/InventarioContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <InventarioProvider>
      <ProveedoresProvider>
        {children}
      </ProveedoresProvider>
    </InventarioProvider>
  );
}