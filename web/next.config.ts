import type { NextConfig } from "next";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), "../.env") });

const nextConfig: NextConfig = {
  devIndicators: false,
};

export default nextConfig;
