import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';

interface SidebarItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  isActive?: boolean;
}

function SidebarItem({ href, icon, label, isActive }: SidebarItemProps) {
  return (
    <Link 
      href={href}
      className={`flex items-center px-4 py-3 text-sm rounded-lg transition-colors ${
        isActive 
          ? 'bg-pink-100 text-pink-700 font-medium' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </Link>
  );
}

export function Sidebar() {
  const router = useRouter();
  
  const menuItems = [
    { href: '/', icon: '🏠', label: 'Home' },
    { href: '/overview', icon: '📊', label: 'Overview' },
    { href: '/discussions', icon: '💬', label: 'Discussions' },
    { href: '/preimages', icon: '🖼️', label: 'Preimages' },
    { href: '/delegation', icon: '👥', label: 'Delegation' },
    { href: '/bounty', icon: '💰', label: 'Bounty' },
    { href: '/batch-voting', icon: '📊', label: 'Batch Voting' },
    { href: '/treasury', icon: '🏛️', label: 'Treasury' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-4">
        <div className="mb-6">
          <Link 
            href="/create"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
          >
            📝 Create
          </Link>
        </div>
        
        <nav className="space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={router.pathname === item.href}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}