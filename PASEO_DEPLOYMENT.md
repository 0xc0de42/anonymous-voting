# Paseo Asset Hub Deployment Guide

## Deployed Contracts

All contracts have been successfully deployed to **Paseo Asset Hub Testnet** (Chain ID: 420420422)

### Contract Addresses

1. **InscriptionVerifier (HonkVerifier)**
   - Address: `0xdef631289ea9aca0917177abd4a45e147ddb03fd`
   - Transaction: `0x92635bef4fc5397e50df0f2a6aca0a87705750bfdc9063ba85f22d1b13c18965`
   - [View on Explorer](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xdef631289ea9aca0917177abd4a45e147ddb03fd)

2. **VotingVerifier (HonkVerifier)**
   - Address: `0xde2d62c2be462af8a74e467d851b00c19d6cc0da`
   - Transaction: `0x40aa3e40694d4ec6284ffd427d2bdfa36345eeccbc776f5d2b1a09cdfc39ae54`
   - [View on Explorer](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xde2d62c2be462af8a74e467d851b00c19d6cc0da)

3. **Vote (Main Voting Contract)**
   - Address: `0xb5022237fe2bacc4acaacddf9c450e38502784e5`
   - Transaction: `0xb2a4cd22ae5baca3be2bfb08ed07b32fcf110038a66d12d94fee26516ef7e6b7`
   - [View on Explorer](https://blockscout-passet-hub.parity-testnet.parity.io/address/0xb5022237fe2bacc4acaacddf9c450e38502784e5)
   - **Configuration**: Maximum 11 voters, Generator value: 3

## Network Configuration

### Paseo Asset Hub Testnet Details

- **Network Name**: Passet Hub Testnet
- **Chain ID**: 420420422
- **RPC Endpoint**: https://testnet-passet-hub-eth-rpc.polkadot.io
- **WebSocket**: wss://testnet-passet-hub.polkadot.io
- **Native Token**: PAS
- **Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io
- **Faucet**: https://faucet.polkadot.io (Select "Passet Hub: smart contracts")

### Deployer Account

- **Address**: 0xf4cB2AC91E4d86C899fb59Ea7d9a3005C5334593
- **Remaining Balance**: ~4999.99 PAS tokens

## Frontend Configuration

The frontend has been configured to work with Paseo Asset Hub. Key changes made:

### 1. Network Configuration (`frontend/src/wagmi.ts`)
- Enabled Passet Hub Testnet chain definition
- Configured RPC endpoints and block explorer
- Set as default chain for the application

### 2. Public Client (`frontend/src/services/client.ts`)
- Updated to use Passet Hub RPC endpoint
- Changed from Sepolia to Passet Hub

### 3. Contract Addresses (`frontend/src/generated.ts`)
- Updated Vote contract address to Paseo deployment

### 4. Chain IDs (`frontend/src/services/vote.ts`)
- Changed default chain ID from Sepolia to Passet Hub (420420422)
- Updated all transaction functions to use Passet Hub

### 5. Environment Variables (`frontend/.env.local`)
```env
NEXT_PUBLIC_CHAIN_ID=420420422
NEXT_PUBLIC_VOTE_CONTRACT_ADDRESS=0xb5022237fe2bacc4acaacddf9c450e38502784e5
NEXT_PUBLIC_INSCRIPTION_VERIFIER_ADDRESS=0xdef631289ea9aca0917177abd4a45e147ddb03fd
NEXT_PUBLIC_VOTING_VERIFIER_ADDRESS=0xde2d62c2be462af8a74e467d851b00c19d6cc0da
NEXT_PUBLIC_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io
NEXT_PUBLIC_EXPLORER_URL=https://blockscout-passet-hub.parity-testnet.parity.io
```

## Running the Frontend

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   # or
   yarn install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

3. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Connect your wallet (MetaMask, etc.)
   - Add Passet Hub network to your wallet if prompted

## Adding Passet Hub to MetaMask

If your wallet doesn't automatically detect the network, manually add it:

1. Open MetaMask
2. Click on the network dropdown
3. Select "Add Network" → "Add a network manually"
4. Enter the following details:
   - **Network Name**: Passet Hub Testnet
   - **New RPC URL**: https://testnet-passet-hub-eth-rpc.polkadot.io
   - **Chain ID**: 420420422
   - **Currency Symbol**: PAS
   - **Block Explorer URL**: https://blockscout-passet-hub.parity-testnet.parity.io

## Getting Test Tokens

Visit the Polkadot faucet to get PAS tokens:
1. Go to https://faucet.polkadot.io
2. Select "Passet Hub: smart contracts"
3. Enter your wallet address
4. Request tokens

## Contract Interaction

### Using the Vote Contract

The Vote contract is now deployed and ready to use. Functions available:

- **enscribeVoter(bytes proof, bytes32 encrypted_random_value)**: Register as a voter with ZK proof
- **vote(bytes proof, bytes32 encrypted_vote)**: Cast your vote with ZK proof
- **getRegisteredVoters()**: View all registered voters and their voting status
- **get_finalVote()**: Get the final voting result (after all voters have voted)

### Contract Methods via Ethers.js/Viem

```typescript
// Example: Register as a voter
await voteContract.enscribeVoter(proof, encryptedRandomValue);

// Example: Cast a vote
await voteContract.vote(proof, encryptedVote);

// Example: Check voting status
const [voters, hasVoted] = await voteContract.getRegisteredVoters();
```

## Important Notes

⚠️ **Temporary Testnet**: Passet Hub is a temporary testnet that will be decommissioned in Q4 2025 when Asset Hub on Paseo is upgraded with pallet-revive. Contracts deployed here will not migrate to production.

✅ **Development Ready**: The contracts are fully functional and ready for development and testing.

🔍 **Explorer**: All transactions and contract interactions can be viewed on the Blockscout explorer.

## Troubleshooting

### Frontend Issues

1. **Wallet won't connect**:
   - Make sure Passet Hub network is added to your wallet
   - Check that your wallet is on the correct network

2. **Transactions failing**:
   - Ensure you have sufficient PAS tokens for gas
   - Verify the contract address is correct
   - Check transaction details in the block explorer

3. **RPC errors**:
   - The RPC endpoint might be experiencing issues
   - Try refreshing the page or reconnecting your wallet

### Contract Issues

1. **Deployment verification**:
   ```bash
   cast code 0xb5022237fe2bacc4acaacddf9c450e38502784e5 --rpc-url https://testnet-passet-hub-eth-rpc.polkadot.io
   ```

2. **Check contract state**:
   ```bash
   cast call 0xb5022237fe2bacc4acaacddf9c450e38502784e5 "getRegisteredVoters()" --rpc-url https://testnet-passet-hub-eth-rpc.polkadot.io
   ```

## Next Steps

1. ✅ Contracts deployed to Paseo Asset Hub
2. ✅ Frontend configured for Paseo Asset Hub
3. 🔄 Test the voting flow end-to-end
4. 🔄 Deploy VoteFactory contract (optional, for multi-vote support)
5. 🔄 Integrate Arkiv for enhanced data storage
6. 🔄 Add comprehensive error handling and user feedback

## Support

- **Polkadot Forum**: https://forum.polkadot.network
- **Passet Hub Docs**: https://docs.polkadot.com/polkadot-protocol/smart-contract-basics/networks/
- **Block Explorer**: https://blockscout-passet-hub.parity-testnet.parity.io
