'use client';

import { useCreateEntity, useHypergraphApp } from '@graphprotocol/hypergraph-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { User } from '../../lib/schema';
import { getOrCreateUser } from '../../lib/userManager';

export default function AuthenticateSuccess() {
  const { processConnectAuthSuccess } = useHypergraphApp();
  const router = useRouter();
  const searchParams = useSearchParams();
  const spaceId = "f15a17f0-078e-4eae-85e1-78a001e5e83e"; // Use the same space ID as other components
  const createUser = useCreateEntity(User, { space: spaceId });

  useEffect(() => {
    const ciphertext = searchParams.get('ciphertext');
    const nonce = searchParams.get('nonce');

    if (ciphertext && nonce) {
      const initializeUserSession = async () => {
        try {
          // Process the authentication first
          processConnectAuthSuccess({ 
            storage: localStorage, 
            ciphertext, 
            nonce 
          });
          
          console.log('Authentication successful');

          // Create or get user for this session
          const { userId, isNewUser } = await getOrCreateUser(createUser);
          
          if (isNewUser) {
            console.log('Welcome! Created your first user profile:', userId);
          } else {
            console.log('Welcome back! Loaded existing user profile:', userId);
          }

          // Redirect to dashboard
          router.replace('/dashboard');
        } catch (error) {
          console.error('Authentication or user creation error:', error);
          router.replace('/dashboard');
        }
      };

      initializeUserSession();
    }
  }, [searchParams, processConnectAuthSuccess, router, createUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Authenticating...</h1>
        <p className="text-muted-foreground">Please wait while we complete your login and set up your profile.</p>
      </div>
    </div>
  );
}
