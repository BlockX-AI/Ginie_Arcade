/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  webpack: (config) => {
    config.watchOptions = config.watchOptions || {};
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.fallback = { ...config.resolve.fallback, buffer: require.resolve('buffer/') };

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
