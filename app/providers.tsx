'use client';

import React from 'react';
import { ProveedoresProvider } from '@/context/ProveedoresContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ProveedoresProvider>
      {children}
    </ProveedoresProvider>
  );
}