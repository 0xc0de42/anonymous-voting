/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Ignore contract script files during build
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        '**/node_modules/**',
        '**/open_vote_contracts/js-scripts/**',
        '**/open_vote_contracts/broadcast/**',
      ]
    };
    
    return config;
  },
};

module.exports = nextConfig;
