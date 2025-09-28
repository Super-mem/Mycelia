// src/index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HypergraphAppProvider } from '@graphprotocol/hypergraph-react';
import './index.css';
import App from './App';
import { WalletProvider } from './context/WalletProvider';

// Simple mapping for private data only
const mapping = {};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <HypergraphAppProvider mapping={mapping} appId="super-mem-extension">
      <WalletProvider>
        <App />
      </WalletProvider>
    </HypergraphAppProvider>
  </React.StrictMode>
);