'use client';

import { useHypergraphApp, useHypergraphAuth } from '@graphprotocol/hypergraph-react';
import { Button } from './ui/button';

export function LogoutButton() {
  const { logout } = useHypergraphApp();
  const { authenticated } = useHypergraphAuth();

  const handleLogout = () => {
    logout();
    // Optionally redirect or refresh
    window.location.reload();
  };

  return (
    <Button 
      variant="outline"
      onClick={handleLogout} 
      disabled={!authenticated}
      size="sm"
    >
      Logout
    </Button>
  );
}
