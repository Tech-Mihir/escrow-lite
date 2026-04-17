"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { checkFreighterConnection, connectWallet } from "./freighter";

interface WalletContextType {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
  connected: false,
  connecting: false,
  error: null,
  connect: async () => {},
  disconnect: () => {},
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-check on mount
  useEffect(() => {
    checkFreighterConnection().then((state) => {
      setConnected(state.connected);
      setPublicKey(state.publicKey);
      setError(state.error);
    });
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    const state = await connectWallet();
    setConnected(state.connected);
    setPublicKey(state.publicKey);
    setError(state.error);
    setConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setConnected(false);
    setPublicKey(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ publicKey, connected, connecting, error, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
