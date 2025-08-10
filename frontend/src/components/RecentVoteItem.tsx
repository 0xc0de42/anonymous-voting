// frontend/src/components/RecentVoteItem.tsx
import React from 'react';
import VoteButtons from './VoteButtons';

export type ProposalStats = {
  maxVoters: number;        // normalized numbers for UI
  inscribed: number;        // “enscribed” count
  voters: string[];         // list of voter addresses (lowercased ok)
  userInscribed?: boolean;  // whether current user is in voters
  hasVoted?: boolean;       // whether current user voted
};

export default function RecentVoteItem(props: {
  id: bigint;
  voteAddress: `0x${string}`;
  name: string;
  description: string;
  stats?: ProposalStats;
  busy?: boolean;
  onInscribe: () => void | Promise<void>;
  onYay: () => void | Promise<void>;
  onNay: () => void | Promise<void>;
}) {
  const {
    id,
    voteAddress,
    name,
    description,
    stats,
    busy = false,
    onInscribe,
    onYay,
    onNay,
  } = props;

  const max = stats?.maxVoters ?? 0;
  const inscribed = stats?.inscribed ?? 0;
  const votersLen = stats?.voters?.length ?? 0;

  const full = max > 0 && inscribed >= max;
  const hasInscribed = !!stats?.userInscribed;
  const hasVoted = !!stats?.hasVoted;

  // Map to VoteButtons flags (per your rules)
  const canInscribe = !full;
  const canVote = full;
  const votingOpen = full ? hasInscribed : true;

  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-2">
        <h3 className="text-2xl font-extrabold text-gray-800">Vote #{id.toString()}</h3>
        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm border bg-blue-50 text-blue-700 border-blue-200">
          Factory
        </span>
      </div>

      <div className="text-lg font-semibold text-gray-800 mb-1">{name}</div>
      <div className="mb-4 text-gray-700">{description}</div>

      {/* Stats row: always visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Stat label="Maximal voters" value={String(max)} />
        <Stat label="Enscribed voters" value={String(inscribed)} />
        <Stat label="Voters" value={String(votersLen)} />
      </div>

      <div className="text-sm text-gray-500 mb-4">
        <span className="font-semibold text-gray-700">Vote Contract:</span>{' '}
        <span className="font-mono">{shorten(voteAddress)}</span>
      </div>

      <VoteButtons
        canInscribe={canInscribe}
        canVote={canVote}
        hasInscribed={hasInscribed}
        hasVoted={hasVoted}
        votingOpen={votingOpen}
        busy={busy}
        onInscribe={onInscribe}
        onYay={onYay}
        onNay={onNay}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 p-4 bg-gray-50">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-extrabold text-gray-800">{value}</span>
    </div>
  );
}

function shorten(addr: string, chars = 4) {
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}
