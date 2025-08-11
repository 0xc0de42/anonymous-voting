import React from 'react';

export type NewProposalState = {
  name: string;
  description: string;
  numberOfVoters: string; // keep as string for input control
};

interface NewProposalFormProps {
  visible: boolean;
  newProposal: NewProposalState | undefined; // tolerant
  setNewProposal: React.Dispatch<React.SetStateAction<NewProposalState>>;
  onCreate: () => void;     // parent hits factory.createVote(...)
  onCancel: () => void;
  isCreating?: boolean;
  nextId?: number; // totalVotes + 1
}

export default function NewProposalForm({
  visible,
  newProposal,
  setNewProposal,
  onCreate,
  onCancel,
  isCreating = false,
  nextId,
}: NewProposalFormProps) {
  if (!visible) return null;

  // Normalize to safe values in case parent passes undefined
  const safe = {
    name: newProposal?.name ?? '',
    description: newProposal?.description ?? '',
    numberOfVoters: newProposal?.numberOfVoters ?? '',
  };

  const numberOk =
    safe.numberOfVoters !== '' &&
    Number.isFinite(Number(safe.numberOfVoters)) &&
    Number(safe.numberOfVoters) > 0;

  const canCreate =
    safe.name.trim().length > 0 &&
    safe.description.trim().length > 0 &&
    numberOk;

  // Helper to ensure we never spread undefined prev
  const withPrev = (update: Partial<NewProposalState>) =>
    setNewProposal(prev => ({
      name: prev?.name ?? '',
      description: prev?.description ?? '',
      numberOfVoters: prev?.numberOfVoters ?? '',
      ...update,
    }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-gray-200">
        <h2 className="text-2xl font-extrabold mb-2 text-gray-800">Create New Vote</h2>
        {typeof nextId === 'number' && (
          <div className="text-sm text-gray-500 mb-4">
            Auto-assigned ID: <span className="font-semibold">#{nextId}</span>
          </div>
        )}

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Proposal name"
            value={safe.name}
            onChange={(e) => withPrev({ name: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <textarea
            placeholder="Proposal description"
            value={safe.description}
            onChange={(e) => withPrev({ description: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-lg h-24 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <div>
            <input
              type="number"
              min={1}
              placeholder="Number of voters"
              value={safe.numberOfVoters}
              onChange={(e) => withPrev({ numberOfVoters: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
            />
            {!numberOk && safe.numberOfVoters !== '' && (
              <div className="text-xs text-red-600 mt-1">Enter a number &gt; 0</div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={() => {
              if (!canCreate) {
                console.error('Create disabled: invalid form', safe);
                return;
              }
              onCreate();
            }}
            disabled={isCreating || !canCreate}
            className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg shadow transition"
          >
            {isCreating ? 'Creating...' : 'Create'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-400 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg shadow transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
