import type { NextPage } from 'next';
import { Layout } from '../components/Layout/Layout';

const Delegation: NextPage = () => {
  return (
    <Layout title="PolkaVote - Delegation">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Delegation</h1>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            👥 Delegate Votes
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Vote Delegation</h2>
            <p className="text-gray-600 mb-6">
              Delegate your voting power to trusted community members or vote directly on proposals yourself.
            </p>
            <div className="flex gap-4 justify-center">
              <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition-colors">
                Delegate Votes
              </button>
              <button className="border border-pink-600 text-pink-600 hover:bg-pink-50 px-6 py-2 rounded-lg transition-colors">
                View Delegates
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Delegation;