import { CmsSlot } from "@/cms/renderer/cms-slot";

/**
 * Home feature. The storefront owns this layout; the CMS only fills the
 * predefined home slots (`home-top`, `home-bottom`).
 */
export function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 space-y-8 px-4 py-8">
      <CmsSlot slot="home-top" />

      <section className="py-12 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Headless Storefront
        </h1>
        <p className="mt-3 text-muted-foreground">
          Next.js · Strapi · React Query · Zustand
        </p>
      </section>

      <CmsSlot slot="home-bottom" />
    </main>
  );
}
