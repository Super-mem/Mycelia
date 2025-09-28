import { Entity } from '@graphprotocol/hypergraph';
import { Concept } from './schema';
import { useSpaces } from '@graphprotocol/hypergraph-react';
import { useState, useEffect, useRef } from 'react';

/**
 * Simplified manual concept query hook
 * Uses a ref-based approach to query concepts from event handlers
 */
export function useManualConceptQuery() {
  const spaceIds = useSpaces({ mode: "private" });
  const spaceId = spaceIds.data?.[0]?.id;
  
  // We'll store query results here that can be accessed synchronously
  const [allConcepts, setAllConcepts] = useState<Entity.Entity<typeof Concept>[]>([]);
  const queryRef = useRef<((categories: string[]) => Entity.Entity<typeof Concept>[]) | null>(null);

  // Create the query function that can filter the loaded concepts
  const queryConceptsByCategories = (categories: string[]): Entity.Entity<typeof Concept>[] => {
    if (categories.length === 0) return [];
    
    // Filter concepts client-side by category
    const filtered = allConcepts.filter(concept => 
      categories.some(category => 
        concept.category?.toLowerCase().includes(category.toLowerCase()) ||
        concept.name?.toLowerCase().includes(category.toLowerCase())
      )
    );
    
    console.log(`Manual query found ${filtered.length} concepts for categories:`, categories);
    return filtered;
  };

  queryRef.current = queryConceptsByCategories;

  return {
    queryConceptsByCategories: queryRef.current,
    setAllConcepts, // This can be used to populate concepts from a useQuery hook
    isReady: !!spaceId,
    spaceId
  };
}

/**
 * Alternative approach using a callback-based pattern
 * This allows you to get results asynchronously by working with the nested component
 */
export function useAsyncConceptQuery() {
  const spaceIds = useSpaces({ mode: "private" });
  const spaceId = spaceIds.data?.[0]?.id;
  const [queryCallback, setQueryCallback] = useState<((categories: string[]) => void) | null>(null);
  const [lastResults, setLastResults] = useState<Entity.Entity<typeof Concept>[]>([]);

  const queryConceptsByCategoriesAsync = (
    categories: string[], 
    callback: (results: Entity.Entity<typeof Concept>[]) => void
  ) => {
    if (categories.length === 0) {
      callback([]);
      return;
    }

    // Filter from the last loaded results
    const filtered = lastResults.filter(concept => 
      categories.some(category => 
        concept.category?.toLowerCase().includes(category.toLowerCase()) ||
        concept.name?.toLowerCase().includes(category.toLowerCase())
      )
    );
    
    callback(filtered);
  };

  return {
    queryConceptsByCategoriesAsync,
    setLastResults, // This can be used to update results from useQuery
    isReady: !!spaceId,
    spaceId
  };
}
