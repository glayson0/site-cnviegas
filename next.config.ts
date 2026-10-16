import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/books",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
