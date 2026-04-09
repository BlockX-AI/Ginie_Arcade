/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  async rewrites() {
    return [
      // Shooter game requests assets at absolute /shooter/* paths – proxy to actual location
      { source: '/shooter/:path*', destination: '/games/shooter/shooter/:path*' },
    ];
  },
  webpack: (config) => {
    config.watchOptions = config.watchOptions || {};
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};

    config.resolve.alias['@react-native-async-storage/async-storage'] = false;

    const currentIgnored = config.watchOptions.ignored;
    const ignoredList = Array.isArray(currentIgnored)
      ? currentIgnored
      : currentIgnored
        ? [currentIgnored]
        : [];

    config.watchOptions.ignored = [...ignoredList, '**/packages/**', '**/.turbo/**'];

    return config;
  },
};

module.exports = nextConfig;
