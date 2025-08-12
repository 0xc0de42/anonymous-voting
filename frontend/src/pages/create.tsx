import type { NextPage } from 'next';
import React, { useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout/Layout';
import ZkProofSpinner from '../components/ZkProofSpinner';

// Import the same contract setup from your index page
import voteFactoryArtifact from '../../open_vote_contracts/out/VoteFactory.sol/VoteFactory.json';
import broadcast from '../../open_vote_contracts/broadcast/DeployOVFactory.s.sol/11155111/run-latest.json';

import {
  createVote,
  waitForReceipt,
  getRecentVotes,
} from '../services/vote';

// Derive the VoteFactory address from the broadcast transactions
const SEPOLIA_CHAIN_ID = 11155111 as const;
const contractAddress =
  (broadcast.transactions.find((tx: any) => tx.contractName === 'VoteFactory')?.contractAddress ??
    process.env.NEXT_PUBLIC_VOTE_FACTORY_ADDRESS_SEPOLIA) as `0x${string}`;

export const voteFactoryAbi = (voteFactoryArtifact as any).abi as readonly unknown[];

// Integrated NewProposalForm types and component
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
}

function NewProposalForm({
  visible,
  newProposal,
  setNewProposal,
  onCreate,
  onCancel,
  isCreating = false,
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
    <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proposal Name
          </label>
          <input
            type="text"
            placeholder="Enter proposal name"
            value={safe.name}
            onChange={(e) => withPrev({ name: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            placeholder="Describe your proposal in detail"
            value={safe.description}
            onChange={(e) => withPrev({ description: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-vertical"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Number of Voters
          </label>
          <input
            type="number"
            min={1}
            placeholder="Enter maximum number of voters"
            value={safe.numberOfVoters}
            onChange={(e) => withPrev({ numberOfVoters: e.target.value })}
            className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
          />
          {!numberOk && safe.numberOfVoters !== '' && (
            <div className="text-sm text-red-600 mt-2">Please enter a number greater than 0</div>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button
          onClick={() => {
            if (!canCreate) {
              console.error('Create disabled: invalid form', safe);
              return;
            }
            onCreate();
          }}
          disabled={isCreating || !canCreate}
          className="flex-1 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-pink-400"
        >
          {isCreating ? 'Creating Proposal...' : 'Create Proposal'}
        </button>
        <button
          onClick={onCancel}
          disabled={isCreating}
          className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

const Create: NextPage = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const router = useRouter();

  // Form state
  const [newProposal, setNewProposal] = useState<NewProposalState>({
    name: '',
    description: '',
    numberOfVoters: '',
  });

  const [showCreateForm, setShowCreateForm] = useState(true); // Always show the form on create page
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const handleCreateProposal = async () => {
    const { name, description, numberOfVoters } = newProposal;

    if (!address || !name || !description || !numberOfVoters) {
      console.error('Missing required fields to create vote:', {
        address,
        name,
        description,
        numberOfVoters,
      });
      return;
    }

    const count = Number(numberOfVoters);
    if (!Number.isFinite(count) || count <= 0) {
      console.error('Invalid numberOfVoters:', numberOfVoters);
      return;
    }

    try {
      setLoading(true);
      appendLog('Creating new proposal...');

      const hash = await createVote({
        writeContractAsync,
        factoryAddress: contractAddress as `0x${string}`,
        data: { name, description, numberOfVoters: count },
        chainId: sepolia.id,
      });

      appendLog(`✅ Proposal creation transaction sent: ${hash}`);

      const receipt = await waitForReceipt(hash);
      appendLog(
        `🎉 Proposal confirmed in block ${receipt.blockNumber?.toString?.() ?? ''}`
      );

      if (receipt.status !== 'success') {
        console.error('createVote tx failed:', receipt);
        appendLog('❌ Transaction failed');
        return;
      }

      // Reset form on success
      setNewProposal({ name: '', description: '', numberOfVoters: '' });
      appendLog('🎊 Proposal created successfully!');

      // Add a small delay to show the success message before redirecting
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      console.error('Error sending createVote tx:', err);
      appendLog(`❌ Failed to create proposal: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setNewProposal({ name: '', description: '', numberOfVoters: '' });
    setLogs([]);
  };

  return (
    <Layout title="PolkaVote - Create Proposal">
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center">
            <ZkProofSpinner />
            <div className="mt-4 text-white text-lg font-medium">
              Creating your proposal...
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Create New Proposal</h1>
          <p className="text-xl text-gray-600">
            Create a new governance proposal with zero-knowledge privacy protection using Noir proofs.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            {!address ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Wallet Connection Required
                </h3>
                <p className="text-yellow-700">
                  Please connect your wallet to create a new proposal.
                </p>
              </div>
            ) : (
              <NewProposalForm
                visible={showCreateForm}
                newProposal={newProposal}
                setNewProposal={setNewProposal}
                onCreate={handleCreateProposal}
                onCancel={handleCancel}
                isCreating={loading}
              />
            )}
          </div>

          {/* Side Panel - Debug/Logs */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Log</h3>
              
              {logs.length === 0 ? (
                <p className="text-gray-500 text-sm">No activity yet...</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className="text-sm p-2 bg-gray-50 rounded border-l-2 border-pink-400"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
              <h4 className="font-semibold text-blue-800 mb-2">How it works</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Fill in your proposal details</li>
                <li>• Set the maximum number of voters</li>
                <li>• Click &quot;Create Proposal&quot; to deploy</li>
                <li>• Your proposal will be private and secure</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Create;