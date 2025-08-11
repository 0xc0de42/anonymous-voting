// frontend/src/services/vote.ts
import type { Address } from 'viem';
import { sepolia } from 'wagmi/chains';
import type { Config } from 'wagmi';
import type { WriteContractMutateAsync } from 'wagmi/query';

import PublicClientSingleton from './client';
import VoteFactoryJson from '../../open_vote_contracts/out/VoteFactory.sol/VoteFactory.json';
import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';

export interface UiVote {
  id: bigint;
  voteAddress: `0x${string}`;
  name: string;
  description: string;
  numberOfVoters: number;
  registeredVoters: {
    voters: `0x${string}`[];
    hasVoted: boolean[];
  };
}

export type CreateVoteParams = {
  name: string;
  description: string;
  numberOfVoters: number;
};


// Use Wagmi’s exact type for writeContractAsync so it's assignable.
export type WriteAsync = WriteContractMutateAsync<Config, unknown>;

export async function getTotalVotes(opts: {
  factoryAddress: Address;
}): Promise<bigint> {
  const publicClient = PublicClientSingleton.get();
  const total = await publicClient.readContract({
    address: opts.factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'totalVotes',
    args: [],
  });
  return total as bigint;
}

export async function getVoteAddressById(opts: {
  factoryAddress: Address;
  id: bigint;
}): Promise<Address> {
  const publicClient = PublicClientSingleton.get();
  const addr = await publicClient.readContract({
    address: opts.factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'getById',
    args: [opts.id],
  });
  return addr as Address;
}

export async function getVoteMetadata(opts: {
  factoryAddress: Address;
  id: bigint;
}): Promise<{ name: string; description: string; numberOfVoters: number }> {
  const publicClient = PublicClientSingleton.get();
  const [name, description, numberOfVoters] = (await publicClient.readContract({
    address: opts.factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'getMetadata',
    args: [opts.id],
  })) as [string, string, number];
  return { name, description, numberOfVoters };
}

/** Fetch the N most recent votes (newest -> oldest). */
export async function getRecentVotes(opts: {
  factoryAddress: Address;
  limit?: number;
}): Promise<UiVote[]> {
  const { factoryAddress, limit = 10 } = opts;
  const publicClient = PublicClientSingleton.get();

  try {
    const total = await getTotalVotes({ factoryAddress });
    console.log(`Total votes from contract: ${total}`);
    
    const totalNum = Number(total);
    const count = Math.min(limit, Math.max(totalNum, 0));
    console.log(`Will fetch ${count} votes (total: ${totalNum})`);
    
    if (count <= 0) {
      console.log('No votes to fetch, returning empty array');
      return [];
    }

    const startId = totalNum - 1;
    const endId = Math.max(totalNum - count, 0);
    console.log(`Fetching votes from ID ${startId} to ${endId}`);

    const contracts: any[] = [];
    for (let i = startId; i >= endId; i--) {
      contracts.push(
        {
          address: factoryAddress,
          abi: (VoteFactoryJson as any).abi,
          functionName: 'getById',
          args: [BigInt(i)],
        },
        {
          address: factoryAddress,
          abi: (VoteFactoryJson as any).abi,
          functionName: 'getMetadata',
          args: [BigInt(i)],
        }
      );
    }

    const results = await publicClient.multicall({ contracts });
    console.log('Multicall results:', results);

    const stitched: UiVote[] = [];
    let idx = 0;

    // First, collect all the basic vote data
    const votePromises: Promise<UiVote>[] = [];

    for (let id = startId; id >= endId; id--) {
      const byId = results[idx++] as any;
      const metadata = results[idx++] as any;

      // Check if the multicall results are valid
      if (!byId?.result) {
        console.warn(`Failed to get vote address for ID ${id}`);
        continue;
      }

      const voteAddress = byId.result as Address;
      
      // Handle metadata result safely
      let name = 'Unknown Vote';
      let description = 'No description available';
      let numberOfVoters = 0;

      if (metadata?.result && Array.isArray(metadata.result)) {
        [name, description, numberOfVoters] = metadata.result as [string, string, number];
      } else {
        console.warn(`Failed to get metadata for vote ID ${id}, using fallback values`);
        // Optionally, try to fetch metadata individually as fallback
        try {
          const fallbackMetadata = await getVoteMetadata({ factoryAddress, id: BigInt(id) });
          name = fallbackMetadata.name;
          description = fallbackMetadata.description;
        } catch (error) {
          console.error(`Fallback metadata fetch failed for ID ${id}:`, error);
        }
      }

      // Create promise to fetch registered voters for each vote
      const votePromise = getRegisteredVoters({
        voteAddress,
      }).then((registeredVoters) => ({
        id: BigInt(id),
        voteAddress,
        name,
        description,
        numberOfVoters,
        registeredVoters,
      }));

      votePromises.push(votePromise);
    }

    // Wait for all registered voter data to be fetched
    const votesWithRegisteredVoters = await Promise.all(votePromises);

    return votesWithRegisteredVoters;
  } catch (error) {
    console.error('Error in getRecentVotes:', error);
    throw error;
  }
}

/** Create a vote via VoteFactory.createVote(name, description, numberOfVoters). */
export async function createVote(opts: {
  writeContractAsync: WriteAsync;
  factoryAddress: Address;
  data: CreateVoteParams;
  chainId?: number;
}): Promise<`0x${string}`> {
  const { writeContractAsync, factoryAddress, data, chainId = sepolia.id } = opts;
  const { name, description, numberOfVoters } = data;

  const hash = await writeContractAsync({
    address: factoryAddress,
    abi: (VoteFactoryJson as any).abi,
    functionName: 'createVote',
    args: [name, description, BigInt(numberOfVoters)],
    chainId,
  });
  return hash as `0x${string}`;
}

/** Wait for tx receipt using the singleton public client. */
export async function waitForReceipt(hash: `0x${string}`) {
  const publicClient = PublicClientSingleton.get();
  return publicClient.waitForTransactionReceipt({ hash });
}

/* ========== Optional helpers for Vote contract (inscription & vote) ========== */

export async function inscribeOnVote(opts: {
  writeContractAsync: WriteAsync;
  voteAddress: Address;
  voteAbi: any;
  functionName?: string; // default 'inscribe'
  args?: readonly unknown[];
  chainId?: number;
}): Promise<`0x${string}`> {
  const {
    writeContractAsync,
    voteAddress,
    voteAbi,
    functionName = 'inscribe',
    args = [],
    chainId = sepolia.id,
  } = opts;

  const hash = await writeContractAsync({
    address: voteAddress,
    abi: voteAbi,
    functionName,
    args,
    chainId,
  });
  return hash as `0x${string}`;
}

export async function castVoteOnVote(opts: {
  writeContractAsync: WriteAsync;
  voteAddress: Address;
  voteAbi: any;
  functionName?: string; // default 'vote'
  args?: readonly unknown[];
  chainId?: number;
}): Promise<`0x${string}`> {
  const {
    writeContractAsync,
    voteAddress,
    voteAbi,
    functionName = 'vote',
    args = [],
    chainId = sepolia.id,
  } = opts;

  const hash = await writeContractAsync({
    address: voteAddress,
    abi: voteAbi,
    functionName,
    args,
    chainId,
  });
  return hash as `0x${string}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Types for stats
export type VoteStats = {
  maxVoters: bigint;
  inscribedCount: bigint;
  voters: Address[];
};

// Optional: override function names if your Vote.sol uses different ones
export type VoteFnNames = {
  maxVotersFn?: string;       // default: 'maxVoters' | 'numberOfVoters'
  inscribedCountFn?: string;  // default: 'inscribedCount' | 'enrolledCount'
  votersFn?: string;          // default: 'getVoters' | 'voters'
};

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Read helpers (single read, trying multiple fn names)
async function readWithFallback<T = unknown>(opts: {
  address: Address;
  abi: any;
  candidates: { functionName: string; args?: readonly unknown[] }[];
}): Promise<T> {
  const publicClient = PublicClientSingleton.get();
  let lastErr: unknown;
  for (const c of opts.candidates) {
    try {
      const res = await publicClient.readContract({
        address: opts.address,
        abi: opts.abi,
        functionName: c.functionName as any,
        args: (c.args ?? []) as any,
      });
      return res as T;
    } catch (e) {
      lastErr = e;
      // try next candidate
    }
  }
  throw lastErr ?? new Error('No matching function found on contract');
}

// ───────────────────────────────────────────────────────────────────────────────
// NEW: Individual getters
export async function getVoteMaxVoters(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<bigint> {
  const { voteAddress, voteAbi, fnNames } = opts;
  const name = fnNames?.maxVotersFn;
  return readWithFallback<bigint>({
    address: voteAddress,
    abi: voteAbi,
    candidates: [
      { functionName: name ?? 'maxVoters' },
      { functionName: name ?? 'numberOfVoters' },
    ],
  });
}

export async function getVoteInscribedCount(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<bigint> {
  const { voteAddress, voteAbi, fnNames } = opts;
  const name = fnNames?.inscribedCountFn;
  return readWithFallback<bigint>({
    address: voteAddress,
    abi: voteAbi,
    candidates: [
      { functionName: name ?? 'inscribedCount' },
      { functionName: name ?? 'enrolledCount' },
    ],
  });
}

export async function getVoteVoters(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<Address[]> {
  const { voteAddress, voteAbi, fnNames } = opts;
  const name = fnNames?.votersFn;
  return readWithFallback<Address[]>({
    address: voteAddress,
    abi: voteAbi,
    candidates: [
      { functionName: name ?? 'getVoters' },
      { functionName: name ?? 'voters' },
    ],
  });
}

// ───────────────────────────────────────────────────────────────────────────────
// NEW: One-shot stats (multicall)
export async function getVoteStats(opts: {
  voteAddress: Address;
  voteAbi: any;
  fnNames?: VoteFnNames;
}): Promise<VoteStats> {
  const publicClient = PublicClientSingleton.get();
  const { voteAddress, voteAbi, fnNames } = opts;

  // Plan A: try a fast multicall using the default names
  const defaultCalls = [
    { functionName: fnNames?.maxVotersFn ?? 'maxVoters' },
    { functionName: fnNames?.inscribedCountFn ?? 'inscribedCount' },
    { functionName: fnNames?.votersFn ?? 'getVoters' },
  ] as const;

  try {
    const contracts = defaultCalls.map((c) => ({
      address: voteAddress,
      abi: voteAbi,
      functionName: c.functionName as any,
      args: [] as unknown[],
    }));

    const [maxVoters, inscribedCount, voters] = (await publicClient.multicall({
      contracts,
      allowFailure: false,
    })) as [bigint, bigint, Address[]];

    return { maxVoters, inscribedCount, voters };
  } catch {
    // Plan B: fallbacks per field (covers different function names)
    const [maxVoters, inscribedCount, voters] = await Promise.all([
      getVoteMaxVoters({ voteAddress, voteAbi, fnNames }),
      getVoteInscribedCount({ voteAddress, voteAbi, fnNames }),
      getVoteVoters({ voteAddress, voteAbi, fnNames }),
    ]);
    return { maxVoters, inscribedCount, voters };
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// OPTIONAL: Batch stats for many Vote contracts (efficient UI hydration)
export async function getManyVoteStats(opts: {
  votes: { voteAddress: Address; voteAbi: any; fnNames?: VoteFnNames }[];
}): Promise<Record<string, VoteStats>> {
  const results: Record<string, VoteStats> = {};
  await Promise.all(
    opts.votes.map(async (v) => {
      results[v.voteAddress] = await getVoteStats(v);
    })
  );
  return results;
}

export async function enscribeVoterTx(opts: {
  writeContractAsync: WriteContractMutateAsync<any, unknown>;
  voteAddress: Address;
  voteAbi: any;
  proof: `0x${string}`;                  // bytes
  encryptedRandomValue: `0x${string}`;   // 32-byte hex
  chainId?: number;
}): Promise<`0x${string}`> {
  const {
    writeContractAsync,
    voteAddress,
    voteAbi,
    proof,
    encryptedRandomValue,
    chainId = sepolia.id,
  } = opts;

  // NOTE: Vote.sol method is enscribeVoter(bytes, bytes32)
  return inscribeOnVote({
    writeContractAsync,
    voteAddress,
    voteAbi,
    functionName: 'enscribeVoter',
    args: [proof, encryptedRandomValue],
    chainId,
  });
}

export async function getRegisteredVoters(opts: {
  voteAddress: Address;
}): Promise<{ voters: Address[]; hasVoted: boolean[] }> {
  const publicClient = PublicClientSingleton.get();
  const { voteAddress } = opts;

  try {
    const [voters, hasVoted] = (await publicClient.readContract({
      address: voteAddress,
      abi: (VoteJson as any).abi,
      functionName: 'getRegisteredVoters',
      args: [],
    })) as [Address[], boolean[]];

    return { voters, hasVoted };
  } catch (error) {
    console.error(`Failed to get registered voters for ${voteAddress}:`, error);
    return { voters: [], hasVoted: [] };
  }
}