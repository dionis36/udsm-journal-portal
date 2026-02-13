import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    'deck.gl',
    '@deck.gl/core',
    '@deck.gl/layers',
    '@deck.gl/aggregation-layers',
    '@deck.gl/react',
    '@luma.gl/core',
    '@luma.gl/engine',
    '@luma.gl/webgl',
    '@luma.gl/constants'
  ]
};

export default nextConfig;
