import { ProposalListProps } from '../../types/proposal';
import ProposalItem from './ProposalItem';

export default function ProposalList({
  proposals,
  currentAddress,
  isVoting,
  isFinishing,
  isEnrolling,
  onVote,
  onFinish,
  onEnroll,
}: ProposalListProps) {
  if (!proposals || proposals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-lg font-semibold">
        No proposals found. Create the first one!
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {proposals.map((proposal) => (
        <ProposalItem
          key={proposal.id.toString()}
          proposal={proposal}
          currentAddress={currentAddress}
          isVoting={isVoting}
          isFinishing={isFinishing}
          isEnrolling={isEnrolling}
          onVote={onVote}
          onFinish={onFinish}
          onEnroll={onEnroll}
        />
      ))}
    </div>
  );
}
