# Open Vote Contracts

# Forge Dependencies Setup
``` bash
forge install openzeppelin/openzeppelin-contracts
```

``` bash
forge remappings > remappings.txt
```

## Deployment
```bash
forge script script/DeployOVFactory.s.sol:DeployOVFactory \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  -vvvv
```

``` bash
forge script script/DeployOVFactory.s.sol:DeployOVFactory \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify \
  --optimize \
  --optimizer-runs 200 \
  -vvvv
```