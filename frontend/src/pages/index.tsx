import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Layout } from '../components/Layout/Layout';
import RecentVoteItem, { type ProposalStats } from '../components/RecentVoteItem';
import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import SidePanel from '../components/SidePanel';

import type { InscriptionInputs } from '../../types/proposal';

import {
  UiVote,
  getRecentVotes,
  getTotalVotes,
  createVote,
  waitForReceipt,
  inscribeOnVote,
  castVoteOnVote,
} from '../services/vote';

import Crypto, {
  getRandomValue,
  modExp,
  generateEmptyProof,
  generateInscriptionProof,
  generateVotingProof,
  bigIntToBytes32,
  u8ToHex
} from '../services/cryptography';

// 1) Import the compiled artifact (ABI lives here if needed)
import voteFactoryArtifact from '../../open_vote_contracts/out/VoteFactory.sol/VoteFactory.json';

// 2) Import the Sepolia broadcast log to get the deployed address
//    (this file is created by: forge script ... --broadcast)
import broadcast from '../../open_vote_contracts/broadcast/DeployOVFactory.s.sol/11155111/run-latest.json';

// Derive the VoteFactory address from the broadcast transactions
const SEPOLIA_CHAIN_ID = 11155111 as const;
const contractAddress =
  (broadcast.transactions.find((tx: any) => tx.contractName === 'VoteFactory')?.contractAddress ??
    process.env.NEXT_PUBLIC_VOTE_FACTORY_ADDRESS_SEPOLIA) as `0x${string}`;

// Optional: the ABI if/when you need it elsewhere
export const voteFactoryAbi = (voteFactoryArtifact as any).abi as readonly unknown[];

const Home: NextPage = () => {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [recentVotesState, setRecentVotesState] = useState<UiVote[]>([]);
  const recentList = useMemo(() => recentVotesState, [recentVotesState]);
  const [voterStatusByAddr, setVoterStatusByAddr] = useState<Record<string, { isRegistered: boolean; hasVoted: boolean }>>({});
  const [busyByAddr, setBusyByAddr] = useState<Record<string, boolean>>({});
  const [logs, setLogs] = useState<string[]>([]);

  // Filter and search state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'finished' | 'recent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'mostVotes'>('newest');

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [...prev, line]);
  }, []);

  // Enhanced filtered and sorted list
  const filteredAndSortedList = useMemo(() => {
    let filtered = recentList;

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = recentList.filter(vote => {
        const votesCount = vote.registeredVoters.hasVoted.filter(voted => voted).length;
        const maxVoters = Number(vote.numberOfVoters);
        
        switch (filterStatus) {
          case 'active':
            return votesCount < maxVoters; // Still accepting votes
          case 'finished':
            return votesCount >= maxVoters; // Vote quota reached
          case 'recent':
            // Show votes created in the last 7 days (you might need to add timestamp to UiVote)
            // For now, show all as we don't have timestamp data
            return true;
          default:
            return true;
        }
      });
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(vote => 
        vote.name.toLowerCase().includes(term) || 
        vote.description.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return Number(b.id) - Number(a.id); // Assuming higher ID = newer
        case 'oldest':
          return Number(a.id) - Number(b.id);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'mostVotes':
          const aVotes = a.registeredVoters.hasVoted.filter(voted => voted).length;
          const bVotes = b.registeredVoters.hasVoted.filter(voted => voted).length;
          return bVotes - aVotes;
        default:
          return 0;
      }
    });

    return sorted;
  }, [recentList, filterStatus, searchTerm, sortBy]);

  // Calculate stats from actual data
  const stats = useMemo(() => {
    const totalProposals = recentList.length;
    
    const totalVotesCast = recentList.reduce((total, vote) => {
      return total + vote.registeredVoters.hasVoted.filter(voted => voted).length;
    }, 0);
    
    const totalRegistrations = recentList.reduce((total, vote) => {
      return total + vote.registeredVoters.voters.length;
    }, 0);

    return {
      totalProposals,
      totalVotesCast,
      totalActiveVoters: totalRegistrations,
    };
  }, [recentList]);

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

      const voteDegree = value ? 1n : 0n;              // yay=1, nay=0
      const voteHex = bigIntToBytes32(voteDegree);     // 0x… (bytes32)
      const enc = modExp(Crypto.generator, voteDegree);
      const encHex = bigIntToBytes32(enc);             // 0x… (bytes32)

      // Prove (logs go to SidePanel via appendLog)
      const { proof } = await generateVotingProof(voteHex, encHex, appendLog);
      const proofHex = u8ToHex(proof);                 // bytes -> 0x…

      appendLog(`Vote: sending tx for ${voteAddress}…`);
      const tx = await castVoteOnVote({
        writeContractAsync,
        voteAddress,
        voteAbi: (VoteJson as any).abi,
        functionName: 'vote',                          // vote(bytes,bytes32)
        args: [proofHex, encHex],
      });

      appendLog(`✅ vote tx sent: ${tx}`);
      const receipt = await waitForReceipt(tx);
      appendLog(`vote confirmed in block ${receipt.blockNumber?.toString?.() ?? ''}`);

      // Refresh voter status after successful vote
    } catch (e) {
      console.error('vote failed:', e);
      appendLog(`❌ vote failed: ${String(e)}`);
    } finally {
      setBusyByAddr(m => ({ ...m, [voteAddress]: false }));
    }
  };

  return (
    <Layout title="PolkaVote - Home">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Welcome to PolkaVote</h1>
          <p className="text-xl text-gray-600 mb-6">
            Private governance voting powered by zero-knowledge proofs and Noir
          </p>

          <div className="flex gap-4">
            <Link
              href="/create"
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              🏛️ Create Proposal
            </Link>
            <Link
              href="/overview"
              className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              📊 View Overview
            </Link>
          </div>
        </div>

        {/* Active Proposals Section with Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Proposals</h2>
            <Link 
              href="/create"
              className="text-pink-600 hover:underline text-sm"
            >
              Create New →
            </Link>
          </div>

          {/* Filter and Search Controls */}
          <div className="mb-6 space-y-4">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All', icon: '📋' },
                { key: 'active', label: 'Active', icon: '🔴' },
                { key: 'finished', label: 'Finished', icon: '✅' },
                { key: 'recent', label: 'Recent', icon: '🕒' }
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === key
                      ? 'bg-pink-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Search and Sort Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search proposals by name or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">🔍</span>
                  </div>
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="newest">📅 Newest First</option>
                  <option value="oldest">📅 Oldest First</option>
                  <option value="name">🔤 Name A-Z</option>
                  <option value="mostVotes">📊 Most Votes</option>
                </select>
              </div>
            </div>

            {/* Results Counter */}
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedList.length} of {recentList.length} proposals
              {searchTerm && (
                <span> matching "{searchTerm}"</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {filteredAndSortedList.length === 0 ? (
              <div className="text-center py-12">
                {recentList.length === 0 ? (
                  <div className="text-gray-400 text-lg font-semibold">
                    No proposals found. Create the first one!
                  </div>
                ) : (
                  <div className="text-gray-400 text-lg font-semibold">
                    No proposals match your current filters.
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setSearchTerm('');
                      }}
                      className="block mx-auto mt-2 text-pink-600 hover:underline"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredAndSortedList.map((v) => {
                // Get voter status for this vote
                console.log('Fetching voter status for:', v.voteAddress);
                console.log('Registered voters:', v.registeredVoters);

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

        {/* Quick Stats - Updated with actual data */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-pink-600 mb-2">
              {stats.totalProposals}
            </div>
            <div className="text-gray-600">Active Proposals</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {stats.totalVotesCast}
            </div>
            <div className="text-gray-600">Total Votes Cast</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {stats.totalActiveVoters}
            </div>
            <div className="text-gray-600">Active Voters</div>
          </div>
        </div>
      </div>
      <SidePanel logs={logs} proof={null} witness={null} />
    </Layout>
  );
};

export default Home;
