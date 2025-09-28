import './App.css';
import { useWallet } from './context/WalletProvider';
import { useHypergraphAuth, useHypergraphApp , useQuery, useSpaces} from '@graphprotocol/hypergraph-react';
import { SpaceDisplay } from './components/SpaceDisplay';
import { useEffect, useState } from 'react';
import { Fact } from './schema';

function App() {
  const { isAuthenticated, connectWallet, disconnectWallet, account } = useWallet();
  const { authenticated: geoAuthenticated } = useHypergraphAuth();
  const { processConnectAuthSuccess, redirectToConnect } = useHypergraphApp();
  const [authData, setAuthData] = useState('');
  const [showManualAuth, setShowManualAuth] = useState(false);

  const spaceId = "f15a17f0-078e-4eae-85e1-78a001e5e83e";

  let { data: facts, error: queryError, isPending: isLoading } = useQuery(Fact, { 
    mode: 'private', 
    space: spaceId,
    include: { user: {}, concept: {} }
  });

  console.log('Auth states:', { 
    walletAuthenticated: isAuthenticated, 
    geoAuthenticated,
    account 
  });

  // Handle authentication callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ciphertext = urlParams.get('ciphertext');
    const nonce = urlParams.get('nonce');
    
    console.log('URL params:', { ciphertext, nonce });
    console.log('Current URL:', window.location.href);
    
    if (ciphertext && nonce) {
      console.log('Processing auth success...');
      try {
        processConnectAuthSuccess({ 
          storage: localStorage, 
          ciphertext, 
          nonce 
        });
        // Clear the URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Error processing auth:', error);
      }
    }
  }, [processConnectAuthSuccess]);

  const handleGeoLogin = () => {
    // Generate a unique webhook URL for this session
    const mockCallbackUrl = `https://webhook.site/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Copy the webhook URL to clipboard
    navigator.clipboard.writeText(mockCallbackUrl).then(() => {
      alert(`Callback URL copied to clipboard:\n${mockCallbackUrl}\n\nYou'll need this for the authentication flow.`);
    }).catch(() => {
      alert(`Use this callback URL:\n${mockCallbackUrl}`);
    });
    
    // Use redirectToConnect similar to the super-app
    redirectToConnect({
      storage: localStorage,
      connectUrl: 'https://connect.geobrowser.io/',
      successUrl: mockCallbackUrl,
      redirectFn: (url: URL) => {
        // Open in new tab instead of same window
        chrome.tabs.create({
          url: url.toString(),
          active: true
        });
      },
    });
  };

  const handleManualAuth = () => {
    try {
      const parsedData = JSON.parse(authData);
      console.log('Manual auth data:', parsedData);
      
      // Check if it's URL format with ciphertext and nonce as query params
      if (typeof parsedData === 'string' && parsedData.includes('ciphertext=')) {
        const url = new URL(parsedData);
        const ciphertext = url.searchParams.get('ciphertext');
        const nonce = url.searchParams.get('nonce');
        
        if (ciphertext && nonce) {
          processConnectAuthSuccess({
            storage: localStorage,
            ciphertext,
            nonce
          });
        } else {
          alert('Could not find ciphertext and nonce in the URL');
          return;
        }
      }
      // If the data has ciphertext and nonce directly, use processConnectAuthSuccess
      else if (parsedData.ciphertext && parsedData.nonce) {
        processConnectAuthSuccess({
          storage: localStorage,
          ciphertext: parsedData.ciphertext,
          nonce: parsedData.nonce
        });
      } else {
        // Otherwise, directly set the data to localStorage
        Object.keys(parsedData).forEach(key => {
          localStorage.setItem(key, typeof parsedData[key] === 'string' ? parsedData[key] : JSON.stringify(parsedData[key]));
        });
        // Refresh the page to pick up the new auth state
        window.location.reload();
      }
      
      setAuthData('');
      setShowManualAuth(false);
    } catch (error) {
      // If it's not JSON, maybe it's a URL string
      if (authData.includes('ciphertext=')) {
        try {
          const url = new URL(authData);
          const ciphertext = url.searchParams.get('ciphertext');
          const nonce = url.searchParams.get('nonce');
          
          if (ciphertext && nonce) {
            processConnectAuthSuccess({
              storage: localStorage,
              ciphertext,
              nonce
            });
            setAuthData('');
            setShowManualAuth(false);
            return;
          }
        } catch (urlError) {
          console.error('Error parsing URL:', urlError);
        }
      }
      
      console.error('Error parsing auth data:', error);
      alert('Invalid format. Please provide either:\n1. A URL with ciphertext and nonce parameters\n2. A JSON object with ciphertext and nonce\n3. A JSON object with localStorage data');
    }
  };

  const generateWebhookUrl = () => {
    // Generate a unique webhook URL
    const webhookUrl = `https://webhook.site/${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    navigator.clipboard.writeText(webhookUrl).then(() => {
      alert(`Webhook URL copied to clipboard:\n${webhookUrl}\n\nUse this as your callback URL in Geo Connect.`);
    }).catch(() => {
      alert(`Use this webhook URL as your callback:\n${webhookUrl}`);
    });
  };

  return (
    <div className="App">
      <header className="App-header">
        <h3>Super-mem Extension</h3>
        
        {/* MetaMask Connection */}
        <div style={{ marginBottom: '10px' }}>
          <button onClick={isAuthenticated ? disconnectWallet : connectWallet}>
            {isAuthenticated ? 'Disconnect Wallet' : 'Connect MetaMask'}
          </button>
          {isAuthenticated && account && (
            <p style={{ fontSize: '12px', margin: '5px 0' }}>
              Connected: {account}
            </p>
          )}
        </div>

        {/* Geobrowser Connection */}
        <div style={{ marginBottom: '10px' }}>
          {!geoAuthenticated ? (
            <div>
              <button 
                onClick={handleGeoLogin}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#007acc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '8px'
                }}
              >
                Sign in with Geo Connect
              </button>
              
              <button 
                onClick={() => setShowManualAuth(!showManualAuth)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Manual Auth
              </button>

              {showManualAuth && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '10px', 
                  border: '1px solid #ccc', 
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{ marginBottom: '10px' }}>
                    <button 
                      onClick={generateWebhookUrl}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        marginBottom: '8px'
                      }}
                    >
                      Generate Webhook URL
                    </button>
                    <p style={{ fontSize: '10px', margin: '4px 0', color: '#666' }}>
                      1. Click above to get a webhook URL<br/>
                      2. Go to <a href="https://connect.geobrowser.io/" target="_blank" rel="noopener noreferrer">connect.geobrowser.io</a><br/>
                      3. Use the webhook URL as your callback<br/>
                      4. After login, copy the callback URL and paste below
                    </p>
                  </div>
                  
                  <p style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}>
                    Paste the callback URL or authentication data:
                  </p>
                  <textarea
                    value={authData}
                    onChange={(e) => setAuthData(e.target.value)}
                    placeholder='https://webhook.site/xxx?ciphertext=...&nonce=... OR {"ciphertext": "...", "nonce": "..."}'
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ marginTop: '8px' }}>
                    <button 
                      onClick={handleManualAuth}
                      disabled={!authData.trim()}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: authData.trim() ? '#28a745' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: authData.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '12px',
                        marginRight: '8px'
                      }}
                    >
                      Apply Auth
                    </button>
                    <button 
                      onClick={() => {
                        setAuthData('');
                        setShowManualAuth(false);
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'transparent',
                        color: '#6c757d',
                        border: '1px solid #6c757d',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div style={{ 
                padding: '8px', 
                backgroundColor: '#d4edda', 
                color: '#155724', 
                borderRadius: '4px',
                fontSize: '12px',
                marginBottom: '8px'
              }}>
                ✅ Authenticated with Geo Connect
              </div>
              <button 
                onClick={() => {
                  // Clear localStorage auth data
                  localStorage.clear();
                  window.location.reload();
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Show SpaceDisplay only if authenticated with Geobrowser */}
      {geoAuthenticated ? (
        <SpaceDisplay />
      ) : (
        <div style={{ 
          padding: '15px', 
          textAlign: 'center', 
          color: '#856404',
          backgroundColor: '#fff3cd',
          borderRadius: '4px',
          margin: '10px'
        }}>
          <p>Please sign in with Geo Connect to view your private spaces.</p>
        </div>
      )}
    </div>
  );
}

export default App;