import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.mhorkub.com" }],
        destination: "https://mhorkub.com/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
