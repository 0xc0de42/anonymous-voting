import type { NextPage } from 'next';
import { Layout } from '../components/Layout/Layout';

const Discussions: NextPage = () => {
  return (
    <Layout title="PolkaVote - Discussions">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Discussions</h1>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            💬 New Discussion
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Community Discussions</h2>
            <p className="text-gray-600 mb-6">
              Engage with the PolkaVote community to discuss proposals, share ideas, and collaborate on governance decisions.
            </p>
            <button className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg transition-colors">
              Start a Discussion
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Discussions;