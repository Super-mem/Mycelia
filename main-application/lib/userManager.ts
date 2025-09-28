import { useCreateEntity } from '@graphprotocol/hypergraph-react';
import { User } from './schema';

const USER_ID_STORAGE_KEY = 'hypergraph_user_id';

/**
 * Gets or creates a user on first login and manages localStorage
 */
export async function getOrCreateUser(
  createUser: ReturnType<typeof useCreateEntity<typeof User>>,
  userName: string = 'User'
): Promise<{ userId: string; isNewUser: boolean }> {
  // First, check if we already have a user ID in localStorage
  const existingUserId = localStorage.getItem(USER_ID_STORAGE_KEY);
  
  if (existingUserId) {
    console.log('Found existing user ID in localStorage:', existingUserId);
    return { userId: existingUserId, isNewUser: false };
  }

  // If no user ID exists, create a new user in the knowledge graph
  try {
    console.log('Creating new user in knowledge graph...');
    const user = await createUser({ name: userName });
    
    // Save the user ID to localStorage for future sessions
    localStorage.setItem(USER_ID_STORAGE_KEY, user.id);
    console.log('Created new user and saved ID to localStorage:', user.id);
    
    return { userId: user.id, isNewUser: true };
  } catch (error) {
    console.error('Error creating user:', error);
    throw new Error('Failed to create user in knowledge graph');
  }
}

/**
 * Gets the current user ID from localStorage
 */
export function getCurrentUserId(): string | null {
  return localStorage.getItem(USER_ID_STORAGE_KEY);
}

/**
 * Clears the user ID from localStorage (for logout)
 */
export function clearCurrentUser(): void {
  localStorage.removeItem(USER_ID_STORAGE_KEY);
  console.log('Cleared user ID from localStorage');
}

/**
 * Sets a user ID in localStorage (for manual override if needed)
 */
export function setCurrentUserId(userId: string): void {
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  console.log('Set user ID in localStorage:', userId);
}
