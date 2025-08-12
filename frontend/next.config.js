/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');

    config.externals.push({
      '../open_vote_contracts/js-scripts/generateInscriptionProof': 'commonjs ../open_vote_contracts/js-scripts/generateInscriptionProof',
    });
    return config;
  },
    excludeFiles: (src) => {
    if (src.includes('open_vote_contracts/js-scripts/')) return true;
    return false;
  }
};

module.exports = nextConfig;
