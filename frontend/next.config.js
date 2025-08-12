/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Completely ignore contract script files during build
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add rule to ignore problematic files
    config.module.rules.push({
      test: /open_vote_contracts\/js-scripts\/.*\.ts$/,
      loader: 'ignore-loader'
    });

    // Also ignore them in resolve
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Redirect problematic imports to empty module
      '../open_vote_contracts/js-scripts/generateInscriptionProof': false,
      '../../open_vote_contracts/js-scripts/generateInscriptionProof': false,
    };

    // Alternative: exclude from compilation entirely
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'ethers': 'ethers',
        '../open_vote_contracts/js-scripts/generateInscriptionProof': 'commonjs ../open_vote_contracts/js-scripts/generateInscriptionProof'
      });
    }
    
    return config;
  },
  // Experimental: exclude files from being traced
  experimental: {
    outputFileTracing: true,
    outputFileTracingIgnores: [
      'open_vote_contracts/js-scripts/**/*',
      '**/ethers/**',
    ]
  }
};

module.exports = nextConfig;
