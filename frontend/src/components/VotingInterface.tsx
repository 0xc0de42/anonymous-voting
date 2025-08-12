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
import Crypto, {
  getRandomValue,
  modExp,
  modMul,
  generateEmptyProof,
  generateInscriptionProof,
  generateVotingProof,
  bigIntToBytes32,
  u8ToHex
} from '../services/cryptography';

import {
  UiVote,
  getRegisteredVoters,
  getRecentVotes,
  getTotalVotes,
  getDecryptionShareByIndex,
  createVote,
  waitForReceipt,
  inscribeOnVote,
  castVoteOnVote,
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
  //const [nextId, setNextId] = useState<number | undefined>(undefined);

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

  // Add state to track voter statuses
  const [voterStatusByAddr, setVoterStatusByAddr] = useState<Record<string, { isRegistered: boolean; hasVoted: boolean }>>({});

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  // Add this useEffect to fetch recent votes when component mounts
  useEffect(() => {
    const fetchRecentVotes = async () => {
      try {
        console.log('Fetching recent votes for factory:', contractAddress);
        const votes = await getRecentVotes({
          factoryAddress: contractAddress as `0x${string}`,
          // You may need to specify a limit here based on your getRecentVotes implementation
        });
        console.log('Fetched votes:', votes);
        setRecentVotesState(votes);
        appendLog(`✅ Loaded ${votes.length} proposals`);
      } catch (error) {
        console.error('Failed to fetch recent votes:', error);
        appendLog(`❌ Failed to fetch proposals: ${String(error)}`);
      }
    };

    if (contractAddress) {
      fetchRecentVotes();
    }
  }, [contractAddress, appendLog]);

  // Also add a function to refresh votes after creating a new one
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

      // Refresh the votes list after successful creation
      try {
        const votes = await getRecentVotes({
          factoryAddress: contractAddress as `0x${string}`,
        });
        setRecentVotesState(votes);
      } catch (error) {
        console.error('Failed to refresh votes:', error);
        appendLog(`⚠️ Failed to refresh proposals: ${String(error)}`);
      }
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
      let randomValue = bigIntToBytes32(getRandomValue());
      let encryptedRandomValue = modExp(Crypto.generator, randomValue);
      let encryptedRandomValueBytes = bigIntToBytes32(encryptedRandomValue);
      let { proof, publicInputs } = await generateInscriptionProof(randomValue, encryptedRandomValueBytes, appendLog);
      const inputs: InscriptionInputs = { proof: u8ToHex(proof), encryptedRandomValue: encryptedRandomValueBytes };
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

      // Refresh voter status after successful inscription
    } catch (e) {
      console.error('inscribe failed:', e);
      appendLog(`❌ enscribeVoter failed: ${String(e)}`);
    } finally {
      setBusyByAddr((m) => ({ ...m, [voteAddress]: false }));
    }
  };

  const onVote = async (voteAddress: `0x${string}`, value: boolean) => {
  try {
    setBusyByAddr(m => ({ ...m, [voteAddress]: true }));

    if (!address) {
      appendLog('❌ Connect your wallet before voting.');
      return;
    }
    const account = address as `0x${string}`;

    const voteDegree = value ? 1n : 0n; // 1 or 0
    const voteHex = bigIntToBytes32(voteDegree);

    const gPowVote = modExp(Crypto.generator, voteDegree); // g^vote
    const gPowVoteHex = bigIntToBytes32(gPowVote);

    const { proof } = await generateVotingProof(voteHex, gPowVoteHex, appendLog);
    const proofHex = u8ToHex(proof);

    const { voters } = await getRegisteredVoters({ voteAddress });
    const idx = voters.findIndex(v => v.toLowerCase() === account.toLowerCase());
    if (idx < 0) throw new Error('Wallet is not an inscribed voter on this Vote');

    const share = await getDecryptionShareByIndex({ voteAddress, index: BigInt(idx) });
    const encryptedVoteProduct = modMul(gPowVote, share);
    const encryptedVoteHex = bigIntToBytes32(encryptedVoteProduct);

    appendLog(`Vote: sending tx for ${voteAddress}…`);
    const tx = await castVoteOnVote({
      writeContractAsync,
      voteAddress,
      voteAbi: (VoteJson as any).abi,
      functionName: 'vote',
      args: [proofHex, encryptedVoteHex],
    });
    appendLog(`Vote: tx hash ${tx}`);
  } catch (e) {
    appendLog(`❌ vote failed: ${String(e)}`);
  } finally {
    setBusyByAddr(m => ({ ...m, [voteAddress]: false }));
  }
};

  const git = useMemo(() => recentVotesState, [recentVotesState]);

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
              Create Proposal
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
          //nextId={nextId}
          />

          {/* Recent Votes (up to 10 newest) */}
          <div className="grid gap-6">
            {recentList.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-lg font-semibold">
                No proposals found. Create the first one!
              </div>
            ) : (
              recentList.map((v) => {
                // Get voter status for this vote
                console.log('Fetching voter status for:', v.voteAddress);
                console.log('Registered voters:', v.registeredVoters);
                const voterStatus = voterStatusByAddr[v.voteAddress] || { isRegistered: false, hasVoted: false };

                // Check if current user is registered and has voted
                const userAddress = address?.toLowerCase();
                const userIndex = v.registeredVoters.voters.findIndex(voter => voter.toLowerCase() === userAddress);
                const userInscribed = userIndex >= 0;
                const userHasVoted = userIndex >= 0 ? v.registeredVoters.hasVoted[userIndex] : false;

                // Compute stats dynamically from the vote data
                const stats: ProposalStats = {
                  maxVoters: Number(v.numberOfVoters), // Convert bigint to number
                  inscribed: v.registeredVoters.voters.length,
                  voters: v.registeredVoters.voters.map((voter) => voter.toLowerCase()),
                  userInscribed: userInscribed,
                  hasVoted: userHasVoted,
                  // Add the actual vote count
                  votesCount: v.registeredVoters.hasVoted.filter(voted => voted).length
                };
                const busy = !!busyByAddr[v.voteAddress];

                console.log('Vote stats:', { voteAddress: v.voteAddress, stats });

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
