import React from 'react';

export type VoteButtonsProps = {
  canInscribe: boolean;
  canVote: boolean;
  hasInscribed?: boolean;
  hasVoted?: boolean;
  votingOpen?: boolean;
  busy?: boolean;

  onInscribe: () => void;
  onYay: () => void;
  onNay: () => void;
};

export default function VoteButtons({
  canInscribe,
  canVote,
  hasInscribed = false,
  hasVoted = false,
  votingOpen = true,
  busy = false,
  onInscribe,
  onYay,
  onNay,
}: VoteButtonsProps) {
  // rules
  const showInscribe = canInscribe && !hasInscribed;
  const showVoting = canVote && hasInscribed && !hasVoted;

  const disabledGeneral = busy || !votingOpen;

  return (
    <div className="mt-4 space-y-3">
      {showInscribe && (
        <button
          onClick={onInscribe}
          disabled={disabledGeneral}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl shadow transition"
        >
          {busy ? 'Working...' : 'Inscribe'}
        </button>
      )}

      {showVoting && (
        <div className="flex gap-4">
          <button
            onClick={onYay}
            disabled={disabledGeneral}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:bg-gray-400 text-white font-extrabold py-3 px-4 rounded-xl text-lg shadow transition"
          >
            {busy ? 'Working...' : 'Yay'}
          </button>
          <button
            onClick={onNay}
            disabled={disabledGeneral}
            className="flex-1 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:bg-gray-400 text-white font-extrabold py-3 px-4 rounded-xl text-lg shadow transition"
          >
            {busy ? 'Working...' : 'Nay'}
          </button>
        </div>
      )}

      {!showInscribe && !showVoting && (
        <div className="text-sm text-gray-500 text-center">
          {hasVoted
            ? 'You already voted.'
            : hasInscribed
            ? votingOpen
              ? 'You are inscribed. Waiting for voting state...'
              : 'Voting is closed.'
            : 'Not eligible to act on this vote.'}
        </div>
      )}
    </div>
  );
}
