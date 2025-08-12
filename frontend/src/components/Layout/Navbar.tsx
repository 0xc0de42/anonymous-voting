import { ConnectButton } from '@rainbow-me/rainbowkit';

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
        <img src="/polkavote-logo.png" alt="Logo" style={{ width: 60, height: 60, marginRight: 8 }} />
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