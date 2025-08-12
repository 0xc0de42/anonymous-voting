import type { NextPage } from 'next';
import { Layout } from '../components/Layout/Layout';

const Preimages: NextPage = () => {
  return (
    <Layout title="PolkaVote - Preimages">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Preimages</h1>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            🖼️ Submit Preimage
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🖼️</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Preimages</h2>
            <p className="text-gray-600 mb-6">
              Submit and view preimages for governance proposals. Preimages contain the actual proposal data that will be executed.
            </p>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition-colors">
              Submit New Preimage
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Preimages;