// components/ProposalItem.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  // If the parent is still loading/hydrating, bail out safely
  if (!proposal) return null;

  const voteAddr = proposal?.voteAddress as Address | undefined;
  const { writeContractAsync } = useWriteContract();

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
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!currentAddress || !voteAddr) {
        setHasVoted(false);
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
          setHasVoted(Boolean(r));
          return;
        } catch {/* try next */}
      }
      setHasVoted(false);
    })();
  }, [currentAddress, voteAddr]);

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
  const [busy, setBusy] = useState(false);
  async function handleInscribe() {
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

        console.log('hasVoted',hasVoted)

  return (
    <div className="border rounded-2xl p-6 bg-white shadow">
      {/* … your header / description / stats … */}

    {/* Debug info (remove in production) */}
    {process.env.NODE_ENV === 'development' && (
      <div className="text-xs text-gray-500 mb-2">
        Debug: hasVoted = {String(hasVoted)}
      </div>
    )}
    
      <VoteButtons
        canInscribe={canInscribe}
        canVote={canVote}
        hasInscribed={userInscribed}
        hasVoted={hasVoted}
        votingOpen={votingOpen}
        busy={busy || loadingStats}
        onInscribe={handleInscribe}
        onYay={() => onVote(proposal.id, true)}
        onNay={() => onVote(proposal.id, false)}
      />
    </div>
  );
}
