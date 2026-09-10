import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  ...(process.env.ALLOWED_DEV_ORIGIN ? { allowedDevOrigins: [process.env.ALLOWED_DEV_ORIGIN] } : {}),
};

export default nextConfig;
