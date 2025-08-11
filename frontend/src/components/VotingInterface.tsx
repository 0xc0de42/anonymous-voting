// frontend/src/components/VotingInterface.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { sepolia } from 'wagmi/chains';

import ZkProofSpinner from './ZkProofSpinner';
import SidePanel from './SidePanel';
import NewProposalForm, { NewProposalState } from './NewProposalForm';
import RecentVoteItem, { type ProposalStats } from './RecentVoteItem';

import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';
import type { InscriptionInputs } from '../../types/proposal';
import { getRandomValue, modExp, generateEmptyProof, bigIntToBytes32 } from '../services/cryptography';

import {
  UiVote,
  getRecentVotes,
  getTotalVotes,
  createVote,
  waitForReceipt,
  inscribeOnVote,
  // castVoteOnVote,
} from '../services/vote';

export interface VotingInterfaceProps {
  contractAddress: string;
}

export function VotingInterface({ contractAddress }: VotingInterfaceProps) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // form state
  const [newProposal, setNewProposal] = useState<NewProposalState>({
    name: '',
    description: '',
    numberOfVoters: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // ui/debug
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // recent votes
  const [recentVotesState, setRecentVotesState] = useState<UiVote[]>([]);
  const [nextId, setNextId] = useState<number | undefined>(undefined);

  // per-vote busy map for button UX
  const [busyByAddr, setBusyByAddr] = useState<Record<string, boolean>>({});

  // if you compute per-address stats elsewhere, keep them here (optional)
  const [statsByAddr] = useState<Record<string, ProposalStats>>({});

  // // stash the user’s ZK inputs per vote address (fill this from your ZK panel)
  // const [inscriptionByAddr] = useState<Record<string, InscriptionInputs>>({
  //   // Example (remove once you wire real data):
  //   // '0xYourVoteAddress': {
  //   //   proof: '0x...',
  //   //   encryptedRandomValue: '0x...', // 32-byte hex
  //   // },
  // });

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  const refreshRecent = useCallback(async () => {
    try {
      setLoading(true);
      const list = await getRecentVotes({
        factoryAddress: contractAddress as `0x${string}`,
        limit: 10,
      });
      setRecentVotesState(list);

      const total = await getTotalVotes({
        factoryAddress: contractAddress as `0x${string}`,
      });
      setNextId(Number(total) + 1);
    } catch (err) {
      console.error('refreshRecent failed:', err);
      appendLog(`❌ refreshRecent failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  }, [appendLog, contractAddress]);

  useEffect(() => {
    refreshRecent();
  }, [refreshRecent]);

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

      const hash = await createVote({
        writeContractAsync,
        factoryAddress: contractAddress as `0x${string}`,
        data: { name, description, numberOfVoters: count },
        chainId: sepolia.id,
      });

      appendLog(`createVote tx sent: ${hash}`);

      const receipt = await waitForReceipt(hash);
      appendLog(
        `createVote confirmed in block ${receipt.blockNumber?.toString?.() ?? ''}`
      );

      if (receipt.status !== 'success') {
        console.error('createVote tx failed:', receipt);
        return;
      }

      setNewProposal({ name: '', description: '', numberOfVoters: '' });
      setShowCreateForm(false);
      await refreshRecent();
    } catch (err) {
      console.error('Error sending createVote tx:', err);
      appendLog(`❌ createVote failed: ${String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  
  const onInscribe = async (voteAddress: `0x${string}`) => {
    try {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: true }));
      
      // Get inputs for this vote`
      const inputs: InscriptionInputs = { proof: generateEmptyProof(), encryptedRandomValue: bigIntToBytes32(getRandomValue())};
      // const inputs = inscriptionByAddr[voteAddress];
      if (!inputs) {
        appendLog(`⚠️ Missing inscription inputs for ${voteAddress}. Provide {proof, encryptedRandomValue}.`);
        return;
      }

      appendLog(`Inscribe: sending tx for ${voteAddress}…`);
      const txHash = await inscribeOnVote({
        writeContractAsync,
        voteAddress,
        voteAbi: (VoteJson as any).abi,
        functionName: 'enscribeVoter',                           // Vote.sol uses enscribeVoter(bytes,bytes32)
        args: [inputs.proof, inputs.encryptedRandomValue],       // [bytes, bytes32]
        // chainId: sepolia.id,                                   // optional; defaults to sepolia in helper
      });

      appendLog(`✅ enscribeVoter tx sent: ${txHash}`);
      const receipt = await waitForReceipt(txHash);
      appendLog(
        `enscribeVoter confirmed in block ${receipt.blockNumber?.toString?.() ?? ''}`
      );

      // Optional: refresh list or per-vote stats here
      // await refreshRecent();
    } catch (e) {
      console.error('inscribe failed:', e);
      appendLog(`❌ enscribeVoter failed: ${String(e)}`);
    } finally {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: false }));
    }
  };

  const onVote = async (voteAddress: `0x${string}`, value: boolean) => {
    try {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: true }));
      appendLog(`${value ? 'Yay' : 'Nay'} clicked for ${voteAddress} (wire proof/encryptedVote and call castVoteOnVote)`);
      // Example (when you have voting proof/inputs ready):
      // const tx = await castVoteOnVote({
      //   writeContractAsync,
      //   voteAddress,
      //   voteAbi: (VoteJson as any).abi,
      //   functionName: 'vote',
      //   args: [proof, encryptedVote], // (bytes, bytes32) per your contract
      // });
      // await waitForReceipt(tx);
      // await refreshRecent();
    } catch (e) {
      console.error('vote failed:', e);
      appendLog(`❌ vote failed: ${String(e)}`);
    } finally {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: false }));
    }
  };

  const recentList = useMemo(() => recentVotesState, [recentVotesState]);

  return (
    <div className="container mx-auto p-4 md:p-8 relative">
      {/* Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center">
            <ZkProofSpinner />
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-gradient-to-r from-pink-500 to-fuchsia-500 hover:from-pink-600 hover:to-fuchsia-600 text-white font-extrabold py-3 px-6 rounded-xl shadow transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-pink-400"
              disabled={!address}
            >
              + Create Vote
            </button>
          </div>

          {/* Create Vote Form */}
          <NewProposalForm
            visible={showCreateForm}
            newProposal={newProposal}
            setNewProposal={setNewProposal}
            onCreate={handleCreateProposal}
            onCancel={() => setShowCreateForm(false)}
            isCreating={loading}
            nextId={nextId}
          />

          {/* Recent Votes (up to 10 newest) */}
          <div className="grid gap-6">
            {recentList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-lg font-semibold">
                No votes found. Create the first one!
              </div>
            ) : (
              recentList.map((v) => {
                const stats = statsByAddr[v.voteAddress] as ProposalStats | undefined;
                const busy = !!busyByAddr[v.voteAddress];

                return (
                  <RecentVoteItem
                    key={v.id.toString()}
                    id={v.id}
                    voteAddress={v.voteAddress}
                    name={v.name}
                    description={v.description}
                    stats={stats}
                    busy={busy}
                    onInscribe={() => onInscribe(v.voteAddress)}
                    onYay={() => onVote(v.voteAddress, true)}
                    onNay={() => onVote(v.voteAddress, false)}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Side Panel */}
        <SidePanel logs={logs} proof={null} witness={null} />
      </div>
    </div>
  );
}
