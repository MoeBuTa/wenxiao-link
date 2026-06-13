"use server";

import { revalidatePath } from "next/cache";

// Bust the Data Cache for every route under the root layout so an inline
// content edit shows up immediately — the content fetches use revalidate: 30,
// which router.refresh() alone would otherwise still serve from cache.
export async function revalidateContent() {
  revalidatePath("/", "layout");
}
