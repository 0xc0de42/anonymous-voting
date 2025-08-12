import type { NextPage } from 'next';
import { Layout } from '../components/Layout/Layout';

const Overview: NextPage = () => {
  return (
    <Layout title="PolkaVote - Overview">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Overview</h1>
          <button className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
            🔄 Switch to Activity Feed
          </button>
        </div>

        {/* About Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">About</h2>
          <p className="text-gray-600 mb-4">
            Join our Community to discuss, contribute and get regular updates from us! 
            PolkaVote enables private voting using zero-knowledge proofs powered by Noir.
          </p>
          <a href="#" className="text-pink-600 hover:underline">View Gallery</a>
        </div>

        {/* Treasury Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Treasury</h2>
              <button className="text-pink-600 text-sm hover:underline">Details</button>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-2">~$111.34M</div>
            <div className="text-sm text-gray-500 mb-4">DOT: $3.90 <span className="text-red-500">-3.57%</span></div>
            
            {/* Token balances */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <div className="w-6 h-6 bg-pink-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium">26.28M DOT</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium">6.24M USDC</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium">2.38M USDT</span>
              </div>
              <div className="flex items-center">
                <div className="w-6 h-6 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium">3.00M MYTH</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">Spend Period Remaining</h2>
              <span className="text-gray-400">ℹ️</span>
            </div>
            <div className="text-2xl font-bold mb-2 text-gray-800">
              <span className="text-pink-600">21</span> hrs <span className="text-pink-600">44</span> mins / 24 days
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
              <div className="bg-pink-600 h-3 rounded-full" style={{ width: '96.2%' }}></div>
            </div>
            <div className="text-right text-sm font-semibold text-gray-600 mb-4">96.2%</div>
            <div className="text-sm text-gray-600">
              <div className="font-semibold mb-1">Next Burn</div>
              <div className="text-lg font-bold text-gray-800 mb-3">127.85K DOT</div>
              <div className="text-xs text-gray-500">
                If the Treasury ends a spend period without spending all of its funds, it suffers a burn of a percentage of its funds.
              </div>
            </div>
          </div>
        </div>

        {/* Latest Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Latest Activity</h2>
            <a href="#" className="text-pink-600 text-sm hover:underline">View All</a>
          </div>
          
          {/* Activity filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">All (1701)</button>
            <button className="text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors">Discussion</button>
            <button className="text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors">Root</button>
            <button className="text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors">Wish For Change</button>
            <button className="text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors">Big Spender</button>
            <button className="text-gray-600 px-3 py-1 rounded-full text-sm hover:bg-gray-100 transition-colors">Medium Spender</button>
          </div>

          {/* Activity table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr className="text-left text-sm text-gray-600">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Posted by</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Origin</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-4 text-sm text-gray-600">1700</td>
                  <td className="py-4">
                    <a href="#" className="text-blue-600 hover:underline text-sm">
                      [Whitelisted Caller] Upgrade remaining system...
                    </a>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-blue-500 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">S</span>
                      </div>
                      <span className="text-sm font-medium">seadanda</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">11th Aug 25</td>
                  <td className="py-4 text-sm text-gray-600">Whitelisted Caller</td>
                  <td className="py-4">
                    <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                      Decision Deposit Placed
                    </span>
                  </td>
                </tr>
                {/* Add more sample rows */}
                <tr className="border-b border-gray-100">
                  <td className="py-4 text-sm text-gray-600">1699</td>
                  <td className="py-4">
                    <a href="#" className="text-blue-600 hover:underline text-sm">
                      Community Treasury Proposal for Development
                    </a>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mr-3 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">D</span>
                      </div>
                      <span className="text-sm font-medium">developer123</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm text-gray-600">10th Aug 25</td>
                  <td className="py-4 text-sm text-gray-600">Root</td>
                  <td className="py-4">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      Active
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Overview;