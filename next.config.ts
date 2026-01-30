// C:\Users\49mat\OneDrive\Desktop\habit-app\habit-app\next.config.ts
import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
