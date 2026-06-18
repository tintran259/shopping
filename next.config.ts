import type { NextConfig } from "next";

/**
 * Allow next/image to load media served by the Strapi CMS. Derived from
 * NEXT_PUBLIC_STRAPI_URL so it works across local/staging/prod without edits.
 */
const strapiUrl = new URL(
  process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337",
);

// Next 16 blocks optimizing images that resolve to a private/local IP (SSRF
// protection). When the CMS itself is local (dev), allow it; a real remote CMS
// keeps the protection on automatically.
const isLocalStrapi = ["localhost", "127.0.0.1", "::1", "0.0.0.0"].includes(
  strapiUrl.hostname,
);

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: isLocalStrapi,
    remotePatterns: [
      {
        protocol: strapiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: strapiUrl.hostname,
        port: strapiUrl.port || undefined,
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
