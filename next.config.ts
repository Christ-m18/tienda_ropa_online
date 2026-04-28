import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const tunnelHosts = [
  "*.tunnelmole.net",
  "*.ngrok-free.app",
  "*.ngrok.io",
  "*.ngrok.app",
  "*.trycloudflare.com",
  "*.loca.lt",
];

const extraOrigin = process.env.NEXT_PUBLIC_SITE_URL
  ? [new URL(process.env.NEXT_PUBLIC_SITE_URL).host]
  : [];

const nextConfig: NextConfig = {
  allowedDevOrigins: [...tunnelHosts, ...extraOrigin],
  output: 'standalone',
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
      ...(supabaseHost
        ? [{ protocol: "https" as const, hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
      allowedOrigins: [...tunnelHosts, ...extraOrigin],
    },
  },
};

export default nextConfig;
