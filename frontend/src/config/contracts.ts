/**
 * Contract addresses for Passet Hub Testnet
 */

export const PASSET_HUB_CHAIN_ID = 420420422 as const;

export const CONTRACT_ADDRESSES = {
  [PASSET_HUB_CHAIN_ID]: {
    voteFactory: '0x803ac2c25d0ef94289b3efc06dfc87a7903657f0',
    inscriptionVerifier: '0x7ed3d556d65b5426b7c991e3188e5d08875c8de6',
    votingVerifier: '0xab7978bdd5fa03a811cf0022ed40fe8d0ec80065',
  },
} as const;

export const getVoteFactoryAddress = (chainId: number): `0x${string}` => {
  if (chainId === PASSET_HUB_CHAIN_ID) {
    return CONTRACT_ADDRESSES[PASSET_HUB_CHAIN_ID].voteFactory;
  }
  throw new Error(`Unsupported chain ID: ${chainId}`);
};

export const getVoteAddress = (chainId: number): `0x${string}` => {
  return getVoteFactoryAddress(chainId);
};
