// types/proposal.ts
import type { Address } from 'viem';

export interface VotingInterfaceProps {
  contractAddress: string; // or Address if you prefer
}

export interface SidePanelProps {
  logs: string[];
  proof: unknown | null;
  witness: unknown | null;
}

export type InscriptionInputs = {
  proof: `0x${string}`;                // bytes
  encryptedRandomValue: `0x${string}`; // bytes32 hex
};

export interface ProposalCore {
  id: bigint;
  creator: Address;
  description: string;
  voting_system: bigint;
  start_date: bigint;
  end_date: bigint;
  finished: boolean;
  result: bigint;

  // REQUIRED for on-chain reads in ProposalItem
  voteAddress?: Address;

  // Optional fallbacks if you already fetched them off-chain
  maxVoters?: bigint | number;
  inscribedCount?: bigint | number;    // “enscribed”
  voters?: Address[] | string[];
}

export interface ProposalItemProps {
  proposal: ProposalCore;
  currentAddress?: Address;
  isVoting?: boolean;
  isFinishing?: boolean;
  isEnrolling?: boolean;

  // For calling enscribeVoter from inside the item
  inscription?: InscriptionInputs;

  onVote: (proposalId: bigint, yay: boolean) => void;
  onFinish: (proposalId: bigint, result: number) => void;

  // Optional: if you prefer to handle inscription in the parent
  onEnroll?: (proposalId: bigint) => void;
}

export interface ProposalListProps {
  proposals: ProposalCore[];
  currentAddress?: Address;
  isVoting?: boolean;
  isFinishing?: boolean;
  isEnrolling?: boolean;
  onVote: ProposalItemProps['onVote'];
  onFinish: ProposalItemProps['onFinish'];
  onEnroll?: ProposalItemProps['onEnroll'];
}
