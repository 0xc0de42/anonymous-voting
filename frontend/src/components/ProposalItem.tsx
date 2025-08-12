// components/ProposalItem.tsx
import React, { useCallback, useEffect, useState } from 'react';
import type { Address } from 'viem';
import { useWriteContract } from 'wagmi';
import VoteButtons from './VoteButtons';

import VoteJson from '../../open_vote_contracts/out/Vote.sol/Vote.json';
import {
  getVoteStats,
  type VoteStats,
  inscribeOnVote,
  waitForReceipt,
} from '../services/vote';
import PublicClientSingleton from '../services/client';
import type { ProposalItemProps as ItemProps, InscriptionInputs } from '../../types/proposal';

export default function ProposalItem({
  proposal,
  currentAddress,
  isVoting,
  isFinishing,
  isEnrolling,
  onVote,
  onFinish,
  onEnroll,
  inscription,
}: ItemProps & { inscription?: InscriptionInputs }) {
  // Move ALL hooks to the top level - before any early returns or conditions
  const voteAddr = proposal?.voteAddress as Address | undefined;
  const { writeContractAsync } = useWriteContract();
  const [loading, setLoading] = useState(false);
  const [voterStatus, setVoterStatus] = useState<{ isRegistered: boolean; hasVoted: boolean }>({
    isRegistered: false,
    hasVoted: false
  });
  const [busy, setBusy] = useState(false);

  // ── Stats ─────────────────────────────────────────────────────────────
  const [stats, setStats] = useState<VoteStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const refreshStats = useCallback(async () => {
    if (!voteAddr) {
      setStats(null);
      return;
    }
    setLoadingStats(true);
    try {
      const s = await getVoteStats({
        voteAddress: voteAddr,
        voteAbi: (VoteJson as any).abi,
      });
      setStats(s);
    } finally {
      setLoadingStats(false);
    }
  }, [voteAddr]);

  useEffect(() => {
    // only run when we actually have an address
    if (voteAddr) refreshStats();
  }, [voteAddr, refreshStats]);

  // ── Has voted? (best-effort) ─────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (!currentAddress || !voteAddr) {
        setVoterStatus({ isRegistered: false, hasVoted: false });
        return;
      }
      const pc = PublicClientSingleton.get();
      for (const fn of ['hasVoted', 'didVote', 'voted'] as const) {
        try {
          const r = await pc.readContract({
            address: voteAddr,
            abi: (VoteJson as any).abi,
            functionName: fn as any,
            args: [currentAddress as Address],
          });
          setVoterStatus(prev => ({ ...prev, hasVoted: Boolean(r) }));
          return;
        } catch {/* try next */}
      }
      setVoterStatus(prev => ({ ...prev, hasVoted: false }));
    })();
  }, [currentAddress, voteAddr]);

  // NOW you can have early returns or conditional logic after all hooks
  if (!proposal) return null;

  // ── Numbers / membership ─────────────────────────────────────────────
  const maxVoters = Number(stats?.maxVoters ?? proposal.maxVoters ?? 0);
  const inscribed = Number(stats?.inscribedCount ?? proposal.inscribedCount ?? 0);
  const voters = (stats?.voters ?? (proposal.voters ?? [])) as string[];

  const userInscribed =
    !!currentAddress && voters.some(v => v.toLowerCase() === (currentAddress as string).toLowerCase());

  const full = maxVoters > 0 && inscribed >= maxVoters;

  // ── Rules → VoteButtons ──────────────────────────────────────────────
  const canInscribe = !full;
  const canVote = full;
  const votingOpen = full ? userInscribed : true;

  // ── Inscribe action ─────────────────────────────────────────────────
  const handleInscribe = async () => {
    // parent-owned flow
    if (onEnroll) {
      onEnroll(proposal.id);
      return;
    }
    if (!voteAddr) {
      console.error('Missing voteAddress on proposal.');
      return;
    }
    if (!inscription) {
      console.error('Missing inscription proof/inputs for this user.');
      return;
    }
    try {
      setBusy(true);
      const tx = await inscribeOnVote({
        writeContractAsync,
        voteAddress: voteAddr,
        voteAbi: (VoteJson as any).abi,
        functionName: 'enscribeVoter', // (bytes,bytes32)
        args: [inscription.proof, inscription.encryptedRandomValue],
      });
      await waitForReceipt(tx);
      await refreshStats();
    } catch (e) {
      console.error('inscribe failed:', e);
    } finally {
      setBusy(false);
    }
  }

  // Debug info (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log('Debug:', { hasVoted: voterStatus.hasVoted });
  }

  // NOW you can have early returns or conditional logic
  if (loading || loadingStats) {
    return <div>Loading...</div>;
  }

  return (
    <div className="border rounded-2xl p-6 bg-white shadow">
      {/* … your header / description / stats … */}

      <VoteButtons
        canInscribe={canInscribe}
        canVote={canVote}
        hasInscribed={userInscribed}
        hasVoted={voterStatus.hasVoted}
        votingOpen={votingOpen}
        busy={busy || loadingStats}
        onInscribe={handleInscribe}
        onYay={() => onVote(proposal.id, true)}
        onNay={() => onVote(proposal.id, false)}
      />
    </div>
  );
}
