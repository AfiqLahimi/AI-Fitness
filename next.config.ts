import type { NextConfig } from "next";

// GitHub Codespaces serves the site from https://<name>-3000.app.github.dev. Allow form
// submissions (Server Actions) from that address only when running inside a Codespace.
const codespacesDomain = process.env.CODESPACES ? process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN ?? "app.github.dev" : null;

const nextConfig: NextConfig = {
  devIndicators: false,
  ...(codespacesDomain ? { experimental: { serverActions: { allowedOrigins: [`*.${codespacesDomain}`] } } } : {}),
  serverExternalPackages: ["@libsql/client", "libsql"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
