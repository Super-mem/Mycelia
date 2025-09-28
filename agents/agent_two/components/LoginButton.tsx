'use client';

import { useHypergraphApp, useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { Button } from './ui/button';

export function LoginButton() {
  const { redirectToConnect } = useHypergraphApp();
  const { authenticated } = useHypergraphAuth();

  const handleLogin = () => {
    redirectToConnect({
      storage: localStorage,
      connectUrl: 'https://connect.geobrowser.io/',
      successUrl: `${window.location.origin}/authenticate-success`,
      redirectFn: (url: URL) => {
        window.location.href = url.toString();
      },
    });
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={authenticated}
      className="w-full"
    >
      Sign in with Geo Connect
    </Button>
  );
}
