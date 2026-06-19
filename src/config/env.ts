/**
 * Centralized, typed access to environment variables.
 * Fail fast at startup if a required value is missing.
 */
function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  /** Base URL of the Strapi CMS, e.g. http://localhost:1337 */
  strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337",
  /** Server-only Strapi API token (never exposed to the client). */
  strapiToken: process.env.STRAPI_API_TOKEN,
  /** Base URL of the commerce/storefront API. */
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
  /** Public origin of the storefront — for canonical URLs, OG tags, JSON-LD. */
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;

export { required };
