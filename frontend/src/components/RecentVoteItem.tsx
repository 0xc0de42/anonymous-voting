// frontend/src/components/RecentVoteItem.tsx
import React, { useState } from 'react';
import VoteButtons from './VoteButtons';

export type ProposalStats = {
  maxVoters: number;        // normalized numbers for UI
  inscribed: number;        // “enscribed” count
  voters: string[];         // list of voter addresses (lowercased ok)
  userInscribed?: boolean;  // whether current user is in voters
  hasVoted?: boolean;       // whether current user voted
  votesCount?: number;      // total votes cast (Yay + Nay)
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

  const [copied, setCopied] = useState(false);

  const max = stats?.maxVoters ?? 0;
  const inscribed = stats?.inscribed ?? 0;
  const votersLen = stats?.votesCount;

  const full = max > 0 && inscribed >= max;
  const hasInscribed = !!stats?.userInscribed;
  const hasVoted = !!stats?.hasVoted;

  // Map to VoteButtons flags (per your rules)
  const canInscribe = !full;
  const canVote = full;
  const votingOpen = full ? hasInscribed : true;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(voteAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = voteAddress;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

          console.log('hasVoted',hasVoted)
          console.log('hasInscribed',hasInscribed)


  return (
    <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-lg hover:shadow-xl transition-shadow duration-200">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2 gap-2">
        <h3 className="text-2xl font-extrabold text-gray-800">Proposal #{id.toString()}</h3>
        <span className="px-3 py-1 rounded-full text-xs font-bold shadow-sm border bg-blue-50 text-blue-700 border-blue-200">
          Factory
        </span>
      </div>

      <div className="text-lg font-semibold text-gray-800 mb-1">{name}</div>
      <div className="mb-4 text-gray-700">{description}</div>

      {/* Stats row: always visible */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Stat label="Max voters" value={String(max)} />
        <Stat label="Registered voters" value={String(inscribed)} />
        <Stat label="Votes" value={String(votersLen)} />
      </div>

      <div className="text-sm text-gray-500 mb-4 flex items-center justify-center gap-2">
        <span className="font-semibold text-gray-700">Proposal Contract:</span>{' '}
        <span className="font-mono">{shorten(voteAddress)}</span>
        <button
          onClick={copyToClipboard}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-gray-400"
          title="Copy address to clipboard"
        >
          {copied ? (
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
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
