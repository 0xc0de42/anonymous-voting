import { createPublicClient, http, type PublicClient } from 'viem';
import { sepolia } from 'viem/chains';

/**
 * Simple singleton for a viem PublicClient.
 * Avoids passing possibly-undefined clients across components/services.
 */
class PublicClientSingleton {
  private static _client: PublicClient | null = null;

  static get(): PublicClient {
    if (!this._client) {
      this._client = createPublicClient({
        chain: sepolia,
        transport: http('https://1rpc.io/sepolia'), // Use a more reliable RPC endpoint
      });
    }
    return this._client;
  }
}

export default PublicClientSingleton;
