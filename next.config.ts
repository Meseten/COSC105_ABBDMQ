import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // Report-only: watches for anything the future enforce-mode CSP
            // would block, without breaking the app while we tune it.
            key: "Content-Security-Policy-Report-Only",
            value:
              "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co https://generativelanguage.googleapis.com; " +
              "font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
