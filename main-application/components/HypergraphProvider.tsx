'use client';

import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import { mapping } from '../lib/mapping';

interface HypergraphProviderProps {
  children: React.ReactNode;
}

export function HypergraphProvider({ children }: HypergraphProviderProps) {
  return (
    <HypergraphAppProvider mapping={mapping} appId="main-application-memory-core">
      {children}
    </HypergraphAppProvider>
  );
}
