import { QueryProvider } from "./query-provider";

/**
 * App-wide client providers. Add future providers (theme, auth, etc.) here
 * so the root layout stays a Server Component.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
