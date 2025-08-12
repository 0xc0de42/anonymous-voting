import Head from 'next/head';
import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function Layout({ children, title = 'PolkaVote', description = 'Private voting project for Web3Summit from Cracked Devz' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>{title}</title>
        <meta content={description} name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>

      <Navbar />
      
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      <footer className="mt-2 p-2 text-center text-black bg-white">
        © {new Date().getFullYear()} PolkaVote — Private voting project for Web3Summit from Cracked Devz
      </footer>
    </div>
  );
}