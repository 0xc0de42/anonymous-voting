import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { passetHubTestnet } from '../wagmi';

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // Automatically switch to Passet Hub when user connects if they're on a different network
    if (isConnected && chainId !== passetHubTestnet.id) {
      switchChain({ chainId: passetHubTestnet.id });
    }
  }, [isConnected, chainId, switchChain]);

  return null; // This component doesn't render anything
}
