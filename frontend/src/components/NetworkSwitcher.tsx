import { useEffect } from 'react';
import { useAccount, useChainId, useSwitchChain } from 'wagmi';
import { sepolia } from 'wagmi/chains';

export function NetworkSwitcher() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  useEffect(() => {
    // Automatically switch to Sepolia when user connects if they're on a different network
    if (isConnected && chainId !== sepolia.id) {
      switchChain({ chainId: sepolia.id });
    }
  }, [isConnected, chainId, switchChain]);

  return null; // This component doesn't render anything
}
