import type { Metadata } from "next";

import { getPublications } from "../lib/content";
import { PublicationsClient } from "../components/PublicationsClient";

export const metadata: Metadata = {
  title: "Publications",
  description:
    "Peer-reviewed papers and preprints by Wenxiao Zhang, auto-synced from Google Scholar with CORE venue ranks.",
};

export default async function PublicationsPage() {
  const payload = await getPublications();
  return <PublicationsClient payload={payload} />;
}
