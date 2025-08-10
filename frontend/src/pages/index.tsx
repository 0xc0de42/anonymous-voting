import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { VotingInterface } from "../components/VotingInterface";

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
  return (
    <div className="flex flex-col min-h-screen text-center text-sm">
      <Head>
        <title>PolkaVote</title>
        <meta
          content="Private voting with Noir and RainbowKit"
          name="description"
        />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      {/* Navbar */}
      <nav
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/polkavote-logo.png" alt="Logo" style={{ width: 100, height: 100, marginRight: 8 }} />
        </div>
        {/* Project Name */}
        <div style={{ fontWeight: 'bold', fontSize: '3.5rem', letterSpacing: 1 }}>
          <span style={{ color: '#e6007a' }}>Polka</span>Vote
        </div>
        {/* Wallet Connect */}
        <div>
          <ConnectButton />
        </div>
      </nav>

      <main className={styles.main} style={{ flex: 1 }}>
        {/* Use Sepolia address */}
        <VotingInterface contractAddress={contractAddress} />
      </main>

      <footer className="mt-2 p-2 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} PolkaVote — Private voting powered by Noir &amp; RainbowKit
      </footer>
    </div>
  );
};

export default Home;
