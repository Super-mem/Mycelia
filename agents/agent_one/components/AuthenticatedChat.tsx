'use client';

import { useHypergraphAuth, useHypergraphApp } from '@graphprotocol/hypergraph-react';
import MinimalChat from './MinimalChat';
import { LoginButton } from './LoginButton';
import { LogoutButton } from './LogoutButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { User } from 'lucide-react';

export default function AuthenticatedChat() {
  const { authenticated, identity } = useHypergraphAuth();
  const { isConnecting } = useHypergraphApp();

//   if (isConnecting) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-center">
//           <h1 className="text-2xl font-semibold mb-2">Connecting...</h1>
//           <p className="text-muted-foreground">Establishing connection to sync server...</p>
//         </div>
//       </div>
//     );
//   }

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">AI Chat Agent</CardTitle>
            <CardDescription>
              Sign in to access your personal AI assistant powered by hypergraph technology
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header with user info and logout */}
      <div className="border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <User size={20} />
          <div>
            <h1 className="text-xl font-semibold text-foreground">AI Chat Agent</h1>
          </div>
        </div>
        <LogoutButton />
      </div>
      
      {/* Chat interface */}
      <div className="flex-1 overflow-hidden">
        <MinimalChat />
      </div>
    </div>
  );
}
