/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
    };
    
    // Exclude contract files from compilation
    config.module.rules.push({
      test: /\.ts$/,
      include: [/open_vote_contracts/],
      use: 'ignore-loader'
    });

    return config;
  },
};

module.exports = nextConfig;
