// src/context/WalletProvider.tsx
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import Web3 from 'web3';
import CustomConnector from '../connector';

// --- THIS IS THE NEW PART ---
// Define the shape of an EIP-1193 compliant provider
interface EIP1193Provider {
  on: (eventName: string, listener: (...args: any[]) => void) => void;
  removeListener: (eventName: string, listener: (...args: any[]) => void) => void;
  request: (args: { method: string; params?: any[] }) => Promise<any>;
}
// --- END OF NEW PART ---

interface WalletContextType {
  web3: Web3 | null;
  account: string | null;
  chainId: string | null;
  isAuthenticated: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [isAuthenticated, setAuthenticated] = useState<boolean>(false);
  const [connector, setConnector] = useState<CustomConnector | null>(null);

  useEffect(() => {
    setConnector(new CustomConnector());
  }, []);

  useEffect(() => {
    // We cast the generic provider to our specific EIP1193Provider interface
    const provider = connector?.provider as EIP1193Provider | null;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        console.log("Account switched to:", accounts[0]);
        setAccount(accounts[0].toLowerCase());
      } else {
        disconnectWallet();
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log("Network switched to:", chainId);
      setChainId(chainId);
    };

    if (isAuthenticated && provider) {
      provider.on("accountsChanged", handleAccountsChanged);
      provider.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (isAuthenticated && provider) {
        provider.removeListener("accountsChanged", handleAccountsChanged);
        provider.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [isAuthenticated, connector]);

  const connectWallet = async () => {
    if (!connector) return;
    try {
      const { web3, account, chainId } = await connector.activate();
      setWeb3(web3);
      setAccount(account);
      setChainId(chainId);
      setAuthenticated(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  const disconnectWallet = () => {
    connector?.deactivate();
    setWeb3(null);
    setAccount(null);
    setChainId(null);
    setAuthenticated(false);
  };

  return (
    <WalletContext.Provider
      value={{
        web3,
        account,
        chainId,
        isAuthenticated,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};