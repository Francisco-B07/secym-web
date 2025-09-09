import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  webpack: (config) => {
    // Excluir archivos de Supabase Edge Functions
    config.module.rules.push({
      test: /supabase\/functions/,
      loader: "ignore-loader",
    });
    return config;
  },

  // O usar exclude en TypeScript
  exclude: ["**/supabase/functions/**/*"],
};

export default nextConfig;
