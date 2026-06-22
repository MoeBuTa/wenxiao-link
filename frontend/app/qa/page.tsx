import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { QABoard } from "../components/QABoard";
import { QA_ENABLED } from "../lib/features";

export const metadata: Metadata = {
  title: "Q&A",
  description: "Ask me anything — questions, comments, and discussion.",
};

export default function QAPage() {
  if (!QA_ENABLED) notFound();
  return <QABoard />;
}
