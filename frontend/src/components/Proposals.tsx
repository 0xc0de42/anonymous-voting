import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import RecentVoteItem, { type ProposalStats } from './RecentVoteItem';
import { UiVote } from '../services/vote';

interface ProposalsProps {
  recentList: UiVote[];
  address?: string;
  busyByAddr: Record<string, boolean>;
  onInscribe: (voteAddress: `0x${string}`) => void;
  onVote: (voteAddress: `0x${string}`, value: boolean) => void;
}

const Proposals: React.FC<ProposalsProps> = ({
  recentList,
  address,
  busyByAddr,
  onInscribe,
  onVote,
}) => {
  // Filter and search state
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'finished' | 'recent'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'mostVotes'>('newest');

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

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Proposals</h2>
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
            <span> matching {searchTerm}</span>
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
            // Check if current user is registered and has voted
            const userAddress = address?.toLowerCase();
            const userIndex = v.registeredVoters.voters.findIndex(voter => voter.toLowerCase() === userAddress);
            const userInscribed = userIndex >= 0;
            const userHasVoted = userIndex >= 0 ? v.registeredVoters.hasVoted[userIndex] : false;

            // Compute stats dynamically from the vote data
            const stats: ProposalStats = {
              maxVoters: Number(v.numberOfVoters),
              inscribed: v.registeredVoters.voters.length,
              voters: v.registeredVoters.voters.map((voter) => voter.toLowerCase()),
              userInscribed: userInscribed,
              hasVoted: userHasVoted,
              votesCount: v.registeredVoters.hasVoted.filter(voted => voted).length
            };
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
  );
};

export default Proposals;