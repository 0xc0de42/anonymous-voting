import type { NextPage } from 'next';
import { Layout } from '../components/Layout/Layout';

const Treasury: NextPage = () => {
  return (
    <Layout title="PolkaVote - Treasury">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Treasury</h1>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            🏛️ New Proposal
          </button>
        </div>

        {/* Treasury Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Total Treasury</h3>
              <span className="text-green-500">💰</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">$111.34M</div>
            <div className="text-sm text-gray-500">Available funds</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Active Proposals</h3>
              <span className="text-blue-500">📋</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">23</div>
            <div className="text-sm text-gray-500">Pending approval</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Next Burn</h3>
              <span className="text-red-500">🔥</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">127.85K</div>
            <div className="text-sm text-gray-500">DOT tokens</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500">Spend Period</h3>
              <span className="text-yellow-500">⏰</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">21h 44m</div>
            <div className="text-sm text-gray-500">Remaining</div>
          </div>
        </div>

        {/* Treasury Proposals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Treasury Proposals</h2>
          
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏛️</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Treasury Management</h3>
            <p className="text-gray-600 mb-6">
              Submit proposals for treasury funding, track spending, and participate in financial governance decisions.
            </p>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition-colors">
              Submit Treasury Proposal
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Treasury;