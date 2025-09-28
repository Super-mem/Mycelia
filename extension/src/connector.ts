import createMetaMaskProvider from 'metamask-extension-provider';
import Web3 from 'web3';

interface MetaMaskProvider {
  request: (args: { method: string }) => Promise<any>;
}

class CustomConnector {
  public provider: MetaMaskProvider | null = null;
  public web3: Web3 | null = null;
  public chainId: string | null = null;
  public account: string | null = null;

  async activate() {
    // Use the MetaMaskProvider type
    const provider: MetaMaskProvider = createMetaMaskProvider();
    if (!provider) {
      throw new Error("MetaMask provider not detected.");
    }
    this.provider = provider;

    try {
      // The request can return different types, so we'll be safe
      const [accounts, chainId]: [string[] | null, string | null] = await Promise.all([
        this.provider.request({ method: 'eth_requestAccounts' }),
        this.provider.request({ method: 'eth_chainId' }),
      ]);

      // **This is the important part!**
      // Safely check if 'accounts' is an array and has a value
      if (accounts && accounts.length > 0) {
        this.account = accounts[0].toLowerCase();
        this.chainId = chainId;
        this.web3 = new Web3(this.provider);
      } else {
        // Handle the case where the user did not connect an account
        throw new Error("No accounts found. Please connect an account in MetaMask.");
      }

      return {
        provider: this.provider,
        web3: this.web3,
        chainId: this.chainId,
        account: this.account,
      };
    } catch (error) {
      console.error("Could not activate connector", error);
      // Re-throw the error to be caught by the UI
      throw error;
    }
  }

  async deactivate() {
    this.provider = null;
    this.web3 = null;
    this.chainId = null;
    this.account = null;
  }
}

export default CustomConnector;