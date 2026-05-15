/** Next.js configuration — security headers, image domains, and prod tweaks */
import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

// Allow Next.js Image to optimise from these origins. Add more as needed.
const remoteImagePatterns: NextConfig["images"] = {
  remotePatterns: [
    { protocol: "https", hostname: "*.supabase.co", pathname: "/storage/**" },
    { protocol: "https", hostname: "*.supabase.in", pathname: "/storage/**" },
    { protocol: "https", hostname: "images.unsplash.com" },
    { protocol: "https", hostname: "api.qrserver.com" },
    { protocol: "https", hostname: "cdn.brightblue.com" },
  ],
  formats: ["image/avif", "image/webp"],
};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: remoteImagePatterns,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
