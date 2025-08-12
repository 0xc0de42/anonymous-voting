import type { NextPage } from 'next';
import { Layout } from '../components/Layout/Layout';
import { VotingInterface } from '../components/VotingInterface';

// Import your contract setup
import broadcast from '../../open_vote_contracts/broadcast/DeployOVFactory.s.sol/11155111/run-latest.json';

const contractAddress =
  (broadcast.transactions.find((tx: any) => tx.contractName === 'VoteFactory')?.contractAddress ??
    process.env.NEXT_PUBLIC_VOTE_FACTORY_ADDRESS_SEPOLIA) as string;

const VotingInterfacePage: NextPage = () => {
  return (
    <Layout title="PolkaVote - Voting Interface">
      <VotingInterface contractAddress={contractAddress} />
    </Layout>
  );
};

export default VotingInterfacePage;