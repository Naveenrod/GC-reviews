export const dynamic = "force-dynamic";

import { requireAdmin } from "@/lib/admin";
import { getCategories, getLocations } from "@/lib/queries";
import { ImportClient } from "./ImportClient";

export default async function ImportPage() {
  await requireAdmin();
  const [locations, categories] = await Promise.all([
    getLocations(),
    getCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold">Import from Google Places</h1>
      <p className="mt-1 text-slate-500">
        Search for venues and import them straight into your listings.
      </p>
      <div className="mt-6">
        <ImportClient locations={locations} categories={categories} />
      </div>
    </div>
  );
}