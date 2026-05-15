import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['@circle-fin/developer-controlled-wallets'],
  transpilePackages: ['@dynamic-labs/sdk-react-core', '@dynamic-labs/ethereum'],
  allowedDevOrigins: ['192.168.3.103'],
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
