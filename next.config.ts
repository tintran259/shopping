import type { NextConfig } from "next";

/**
 * Allow next/image to load media served by the Strapi CMS and the commerce API.
 * Both are derived from env vars so the config works across local/staging/prod.
 */
const strapiUrl = new URL(
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337",
);

// NEXT_PUBLIC_API_URL ends in /api — strip it to get the origin that serves /uploads.
const apiOrigin = new URL(
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3002/api").replace(/\/api\/?$/, ""),
);

const LOCAL = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

// Next 16 blocks optimizing images that resolve to a private/local IP (SSRF
// protection). Allow it when either the CMS or the API runs locally in dev.
const isLocal = LOCAL.has(strapiUrl.hostname) || LOCAL.has(apiOrigin.hostname);

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: isLocal,
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: strapiUrl.hostname,
        port: strapiUrl.port || undefined,
        pathname: "/uploads/**",
      },
      {
        protocol: apiOrigin.protocol.replace(":", "") as "http" | "https",
        hostname: apiOrigin.hostname,
        port: apiOrigin.port || undefined,
        pathname: "/uploads/**",
      },
      // Placeholder product imagery (mock catalog). Remove once the BE serves
      // real product media through its own host.
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      // Real đặc sản photos (Shopee image CDN) used by the specialty seed.
      { protocol: "https", hostname: "down-vn.img.susercontent.com" },
    ],
  },
};

export default nextConfig;
