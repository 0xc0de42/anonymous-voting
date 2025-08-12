import { ConnectButton } from '@rainbow-me/rainbowkit';
import Image from 'next/image';
import Link from 'next/link';

export function Navbar() {
  return (
    <nav
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 2rem',
        borderBottom: '1px solid #e5e5e5',
        backgroundColor: 'white',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">

        <Image
          src="/polkavote-logo.png" // or whatever your logo source is
          alt="PolkaVote Logo"
          width={32}
          height={32}
          className="h-8 w-8"
        />
        </Link>
      </div>
      
      {/* Project Name */}
      <div style={{ fontWeight: 'bold', fontSize: '2.5rem', letterSpacing: 1 }}>
        <span style={{ color: '#e6007a' }}>Polka</span>Vote
      </div>
      
      {/* Wallet Connect */}
      <div>
        <ConnectButton />
      </div>
    </nav>
  );
}