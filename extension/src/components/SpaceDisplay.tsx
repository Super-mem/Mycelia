
import { useSpaces } from '@graphprotocol/hypergraph-react';
import { useState } from 'react';

function SpaceDisplayContent() {
  const spacesResult = useSpaces({ mode: 'private' });
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');

  const spaceId = "f15a17f0-078e-4eae-85e1-78a001e5e83e"; //TODO: Change this

  

  if ('isPending' in spacesResult && spacesResult.isPending) {
    return (
      <div style={{ 
        padding: '15px', 
        textAlign: 'center',
        color: '#666' 
      }}>
        Loading spaces...
      </div>
    );
  }

  if ('error' in spacesResult && spacesResult.error) {
    return (
      <div style={{ 
        padding: '10px', 
        color: '#c62828', 
        borderRadius: '4px', 
        marginBottom: '10px' 
      }}>
        Error loading spaces: {spacesResult.error.message}
      </div>
    );
  }

  const spaces = spacesResult.data || [];

  if (spaces.length === 0) {
    return (
      <div style={{ 
        padding: '15px', 
        color: '#ef6c00', 
        borderRadius: '4px', 
        marginBottom: '20px' 
      }}>
        <h4>No Private Spaces Found</h4>
        <p>You need to create a private space first. Please visit <a href="https://connect.geobrowser.io/" target="_blank" rel="noopener noreferrer">Geo Connect</a> to create a private space.</p>
      </div>
    );
  }

  // Auto-select first space if none selected
  const currentSpaceId = selectedSpaceId || spaces[0]?.id || '';

  return (
    <div style={{ 
      padding: '15px',
      borderRadius: '4px', 
      marginBottom: '20px' 
    }}>
      <h4>Your Private Spaces</h4>
      
      <div style={{ marginTop: '15px' }}>
        {spaces.map((space) => (
          <div 
            key={space.id} 
            style={{
              padding: '12px',
              border: selectedSpaceId === space.id ? '2px solid #007acc' : '1px solid #e0e0e0',
              borderRadius: '6px',
              marginBottom: '10px',
              backgroundColor: selectedSpaceId === space.id ? '#f0f8ff' : '#f9f9f9',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedSpaceId(space.id)}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              {space.name || 'Unnamed Space'}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ID: {space.id}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        <strong>Total:</strong> {spaces.length} space{spaces.length !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}

export function SpaceDisplay() {
  return <SpaceDisplayContent />;
}